// Renders every animated element of the HTML deck to a transparent PNG and
// records its position + animation, so build_pptx.py can rebuild the deck
// as a native PowerPoint file with real entrance animations.
// Usage: node capture.js   (needs puppeteer-core + Google Chrome)
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'build');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAD = 60; // room for shadows / glows around each element

const CAPTURE_CSS = `
  html.cap *, html.cap *::before, html.cap *::after { animation: none !important; transition: none !important; }
  html.cap, html.cap body { background: transparent !important; }
  html.cap .slide .a { opacity: 1 !important; }
  html.cap #floaters, html.cap #nav, html.cap #progress, html.cap #help { display: none !important; }
  html.cap .cap-hide { visibility: hidden !important; }
  html.cap .bouncer { transform: translate(640px, -30px) !important; }
  html.cap .cap-show { visibility: visible !important; }
`;

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'networkidle0' });
  await page.addStyleTag({ content: CAPTURE_CSS });
  await page.evaluate(() => document.documentElement.classList.add('cap'));
  await page.evaluate(() => document.fonts.ready);

  // background only
  await page.evaluate(() => document.querySelectorAll('.slide').forEach((s) => s.classList.add('cap-hide')));
  await page.screenshot({ path: path.join(OUT, 'bg.png') });
  await page.evaluate(() => {
    document.querySelectorAll('.slide').forEach((s) => s.classList.remove('cap-hide'));
    document.getElementById('bg').style.display = 'none';
  });

  const count = await page.evaluate(() => document.querySelectorAll('.slide').length);
  const manifest = [];

  for (let i = 0; i < count; i++) {
    await page.evaluate((n) => go(n), i);
    // let the canvas visualiser / bouncing ball draw a few seconds of frames
    await new Promise((r) => setTimeout(r, i === 3 ? 3500 : 600));

    const items = await page.evaluate(() => {
      const slide = document.querySelector('.slide.active');
      const all = [...slide.querySelectorAll('.a')].filter((el) => !el.parentElement.closest('.a'));
      return all.map((el, idx) => {
        el.dataset.capIdx = idx;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const item = {
          idx,
          anim: el.dataset.a || 'up',
          delay: parseFloat(el.style.getPropertyValue('--d')) || 0,
          x: r.left, y: r.top, w: r.width, h: r.height,
        };
        if (el.classList.contains('gif')) {
          const ring = (cs.boxShadow.match(/rgba?\([^)]*\)/g) || []).pop() || 'rgb(255,79,163)';
          item.gif = el.querySelector('img').getAttribute('src');
          item.ring = ring.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
          item.rot = parseFloat(cs.getPropertyValue('--rot')) || 0;
          item.border = parseFloat(cs.borderTopWidth) || 8;
        }
        return item;
      });
    });

    const slideItems = [];
    for (const it of items) {
      if (it.gif) {
        it.gif = path.join(ROOT, it.gif);
        slideItems.push(it);
        continue;
      }
      await page.evaluate((idx) => {
        const slide = document.querySelector('.slide.active');
        slide.querySelectorAll('[data-cap-idx]').forEach((el) => {
          const me = el.dataset.capIdx === String(idx);
          el.classList.toggle('cap-hide', !me);
          el.classList.toggle('cap-show', me);
        });
      }, it.idx);
      const x = Math.max(0, it.x - PAD);
      const y = Math.max(0, it.y - PAD);
      const w = Math.min(1920, it.x + it.w + PAD) - x;
      const h = Math.min(1080, it.y + it.h + PAD) - y;
      const file = path.join(OUT, `s${i + 1}_${String(it.idx).padStart(2, '0')}.png`);
      await page.screenshot({ path: file, clip: { x, y, width: w, height: h }, omitBackground: true });
      slideItems.push({ ...it, png: file, x, y, w, h });
    }
    await page.evaluate(() => document.querySelectorAll('.cap-hide, .cap-show').forEach((el) => el.classList.remove('cap-hide', 'cap-show')));
    manifest.push(slideItems);
    console.log(`slide ${i + 1}: ${slideItems.length} elements`);
  }

  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ bg: path.join(OUT, 'bg.png'), slides: manifest }, null, 2));
  await browser.close();
})();
