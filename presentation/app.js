if (location.search.includes("shot")) document.documentElement.classList.add("shot");
// ---------- stage scaling (1920x1080 design canvas) ----------
const deck = document.getElementById('deck');
function fit() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  deck.style.transform = `translate(-50%, -50%) scale(${s})`;
}
addEventListener('resize', fit);
fit();

// ---------- navigation ----------
const slides = [...document.querySelectorAll('.slide')];
const dots = document.getElementById('dots');
const bar = document.querySelector('#progress i');
let cur = 0;

slides.forEach((_, i) => {
  const d = document.createElement('i');
  d.onclick = () => go(i);
  dots.appendChild(d);
});

function go(n) {
  n = Math.max(0, Math.min(slides.length - 1, n));
  slides.forEach((s, i) => {
    s.classList.toggle('active', i === n);
    s.classList.toggle('past', i < n);
  });
  [...dots.children].forEach((d, i) => d.classList.toggle('on', i === n));
  bar.style.width = `${((n + 1) / slides.length) * 100}%`;
  cur = n;
  history.replaceState(null, '', `#${n + 1}`);
}

addEventListener('keydown', (e) => {
  if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go(cur + 1); }
  if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
  if (e.key === 'Home') go(0);
  if (e.key === 'End') go(slides.length - 1);
  if (e.key.toLowerCase() === 'f') {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  }
});
document.getElementById('next').onclick = () => go(cur + 1);
document.getElementById('prev').onclick = () => go(cur - 1);

let touchX = null;
addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; });
addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
  touchX = null;
});

go(Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1));

// ---------- floating notes & paws ----------
const floaters = document.getElementById('floaters');
const glyphs = ['♪', '♫', '♩', '♬', '🐾', '🎹', '🦴', '🎾'];
setInterval(() => {
  const f = document.createElement('div');
  f.className = 'floater';
  f.textContent = glyphs[(Math.random() * glyphs.length) | 0];
  f.style.left = `${Math.random() * 100}vw`;
  f.style.fontSize = `${18 + Math.random() * 30}px`;
  f.style.color = ['#ff4fa3', '#ffd23f', '#3ef2c0', '#4da3ff', '#fff'][(Math.random() * 5) | 0];
  f.style.animationDuration = `${9 + Math.random() * 8}s`;
  floaters.appendChild(f);
  setTimeout(() => f.remove(), 18000);
}, 700);

// ---------- tiny Web Audio piano ----------
let ctx = null;
let master = null;
function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    // simple feedback delay for a bit of "room"
    const delay = ctx.createDelay();
    const fb = ctx.createGain();
    delay.delayTime.value = 0.23;
    fb.gain.value = 0.28;
    master.connect(ctx.destination);
    master.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// C major pentatonic across two octaves, so it can never sound harsh
const PENTA = [0, 2, 4, 7, 9];
const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function scaleNote(i) {
  return 60 + PENTA[i % 5] + 12 * Math.floor(i / 5);
}

function playNote(midi, velocity = 0.8) {
  const ac = audio();
  const t = ac.currentTime;
  const f = midiToHz(midi);
  const env = ac.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.35 * velocity, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.12 * velocity, t + 0.35);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1200 + 4000 * velocity, t);
  lp.frequency.exponentialRampToValueAtTime(600, t + 1.5);
  env.connect(lp).connect(master);
  // a few detuned partials to fake a piano-ish timbre
  [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12], [1.002, 'sine', 0.4]].forEach(([mult, type, g]) => {
    const o = ac.createOscillator();
    const og = ac.createGain();
    o.type = type;
    o.frequency.value = f * mult;
    og.gain.value = g;
    o.connect(og).connect(env);
    o.start(t);
    o.stop(t + 2.3);
  });
}

// ---------- piano key rows ----------
function buildKeys(el, count) {
  for (let i = 0; i < count; i++) {
    const k = document.createElement('div');
    k.className = 'key';
    k.onclick = (e) => { e.stopPropagation(); hitKey(el, i, 0.8); };
    el.appendChild(k);
  }
}
function flashKey(el, i) {
  const k = el.children[i];
  if (!k) return;
  k.classList.add('on');
  setTimeout(() => k.classList.remove('on'), 220);
}
function hitKey(el, i, vel) {
  flashKey(el, i);
  playNote(scaleNote(i), vel);
}
const keys2 = document.getElementById('keys2');
const keys4 = document.getElementById('keys4');
buildKeys(keys2, 15);
buildKeys(keys4, 24);

function burst(x, y) {
  for (let i = 0; i < 8; i++) {
    const b = document.createElement('div');
    b.className = 'burst';
    b.textContent = ['♪', '♫', '🐾', '✨'][i % 4];
    b.style.left = `${x}px`;
    b.style.top = `${y}px`;
    const a = (i / 8) * Math.PI * 2;
    b.style.setProperty('--x', `${Math.cos(a) * 140}px`);
    b.style.setProperty('--y', `${Math.sin(a) * 140}px`);
    b.style.setProperty('--r', `${(Math.random() - 0.5) * 360}deg`);
    b.style.color = ['#ff4fa3', '#ffd23f', '#3ef2c0', '#4da3ff'][i % 4];
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1300);
  }
}

// ---------- slide 2: ball bouncing across the keys ----------
const bouncer = document.querySelector('.bouncer');
let bounceSound = false; // silent until the audience clicks the ball once
let bx = 0;
let dir = 1;
let phase = 0;
let lastKey = -1;
function animateBouncer() {
  const w = keys2.clientWidth - 70;
  bx += dir * 4.2;
  if (bx > w || bx < 0) { dir *= -1; bx = Math.max(0, Math.min(w, bx)); }
  phase += 0.085;
  const h = Math.abs(Math.sin(phase)) * 80;
  bouncer.style.transform = `translate(${bx}px, ${-h}px) rotate(${bx * 2}deg)`;
  if (h < 4) {
    const idx = Math.min(14, Math.max(0, Math.floor(((bx + 35) / keys2.clientWidth) * 15)));
    if (idx !== lastKey) {
      lastKey = idx;
      flashKey(keys2, idx);
      if (bounceSound && cur === 1) playNote(scaleNote(idx), 0.5);
    }
  } else if (h > 30) {
    lastKey = -1;
  }
  requestAnimationFrame(animateBouncer);
}
requestAnimationFrame(animateBouncer);
bouncer.addEventListener('click', (e) => {
  e.stopPropagation();
  bounceSound = !bounceSound;
  const r = bouncer.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2);
  playNote(72, 0.9);
});

// ---------- slide 6: throw the ball for a little arpeggio ----------
const bigBall = document.querySelector('.big-ball');
bigBall.addEventListener('click', (e) => {
  e.stopPropagation();
  bigBall.classList.remove('thrown');
  void bigBall.offsetWidth;
  bigBall.classList.add('thrown');
  const r = bigBall.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2);
  const start = (Math.random() * 3) | 0;
  [0, 2, 4, 7, 5, 9].forEach((step, i) => setTimeout(() => playNote(scaleNote(start + step), 0.9 - i * 0.08), i * 130));
});
bigBall.addEventListener('animationend', (e) => {
  if (e.animationName === 'throw') bigBall.classList.remove('thrown');
});

// ---------- slide 4: simulated live motion visualiser ----------
const cv = document.getElementById('viz');
const g = cv.getContext('2d');
const N = 190;
const series = { ax: [], ay: [], az: [], gyro: [] };
const hits = [];
let tSim = 0;
for (const k in series) for (let i = 0; i < N; i++) series[k].push(0);

function simStep() {
  tSim += 1;
  const spin = (Math.sin(tSim * 0.013) + 1) * 0.5; // slow "play energy"
  const spike = Math.random() < 0.025 ? 0.6 + Math.random() * 0.4 : 0;
  series.ax.push(Math.sin(tSim * 0.11) * 0.35 * spin + (Math.random() - 0.5) * 0.08 + spike * 0.9);
  series.ay.push(Math.cos(tSim * 0.07) * 0.3 * spin + (Math.random() - 0.5) * 0.08 - spike * 0.6);
  series.az.push(Math.sin(tSim * 0.05 + 1) * 0.25 + (Math.random() - 0.5) * 0.06 + spike * 0.4);
  series.gyro.push(spin * 0.8 + Math.sin(tSim * 0.2) * 0.1);
  for (const k in series) series[k].shift();
  if (spike) {
    hits.push({ x: 740, y: 190 - spike * 70, r: 10 + spike * 20, life: 1, v: spike });
    const idx = Math.min(23, Math.floor(spin * 18 + Math.random() * 6));
    flashKey(keys4, idx);
  } else if (Math.random() < spin * 0.06) {
    flashKey(keys4, Math.min(23, Math.floor(spin * 20 + Math.random() * 4)));
  }
}

function drawViz() {
  if (cur === 3) {
    simStep(); simStep();
    const W = cv.width;
    const H = cv.height;
    g.fillStyle = 'rgba(18, 8, 40, 0.55)';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.06)';
    g.lineWidth = 1;
    for (let y = 0; y < H; y += 30) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const lines = [['ax', '#ff5a7a'], ['ay', '#3ef2c0'], ['az', '#ffd23f'], ['gyro', '#4da3ff']];
    lines.forEach(([k, col]) => {
      g.beginPath();
      g.strokeStyle = col;
      g.lineWidth = k === 'gyro' ? 4 : 2.5;
      g.shadowColor = col;
      g.shadowBlur = 10;
      series[k].forEach((v, i) => {
        const x = (i / (N - 1)) * W;
        const y = H / 2 - v * (H / 2.4);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      });
      g.stroke();
    });
    g.shadowBlur = 0;
    for (let i = hits.length - 1; i >= 0; i--) {
      const h = hits[i];
      h.x -= 7.8;
      h.life -= 0.012;
      h.r += 0.6;
      if (h.life <= 0 || h.x < -50) { hits.splice(i, 1); continue; }
      g.beginPath();
      g.strokeStyle = `rgba(255, 79, 163, ${h.life})`;
      g.lineWidth = 4;
      g.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = `rgba(255, 210, 63, ${h.life})`;
      g.font = 'bold 22px Inter';
      g.fillText(`♪ vel ${Math.round(h.v * 127)}`, h.x - 40, Math.max(56, h.y - h.r - 8));
    }
    g.font = '600 15px Inter';
    lines.forEach(([k, col], i) => { g.fillStyle = col; g.fillText(k === 'gyro' ? '|ω| spin' : k, 16 + i * 90, 24); });
  }
  requestAnimationFrame(drawViz);
}
requestAnimationFrame(drawViz);

// keep the mock controls' labels live
document.querySelectorAll('.controls input').forEach((inp, i) => {
  inp.addEventListener('input', () => {
    inp.nextElementSibling.textContent = i === 0 ? `${inp.value} bpm` : `${inp.value}%`;
    if (i === 1 && master) master.gain.value = inp.value / 140;
  });
});
