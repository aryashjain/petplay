# Pawdio: speaker notes

## 1. Music makes dogs go WOAAH!

Hook: music changes how dogs feel. Shelter studies found classical music meant more resting and less barking (Kogan et al., 2012), and soft rock / reggae lowered stress (Univ. of Glasgow & Scottish SPCA, 2017). Dogs also hear up to ~45 kHz, way beyond our ~20 kHz. And dogs love to play: fetch, zoomies, tug. So what if their favourite toy made the music?

## 2. The idea: what if the ball was the band?

The idea: dogs love balls and they respond to music, so we fused them. Step 1, the dog just plays. Step 2, a motion sensor sealed in the ball feels every hit and spin 200 times a second. Step 3, a web page turns that motion into live piano music that always stays in key. On the right is our real prototype: a chew-proof caged ball with the sensor and battery sealed inside.

## 3. Tech 1: Hardware & Firmware

Inside the ball: ESP32-C6 (RISC-V, Wi-Fi 6, BLE 5, deep sleep), a 6-axis MPU IMU on I2C (accelerometer + gyroscope), and a small sealed LiPo. Firmware samples at 200 Hz or more, applies a light low-pass filter, detects impacts from acceleration spikes, packs compact binary frames and streams them over a WebSocket. It auto-reconnects and sleeps when the ball is still, waking on the IMU motion interrupt.

## 4. Tech 2: Web App

The music brain is plain HTML, CSS and JavaScript, no phone app. It decodes the binary frames, maps impact strength to note velocity and rotation speed to pitch and note density, snaps every note to the chosen scale so it never sounds harsh, and synthesises piano with the Web Audio API. It also has a live motion visualiser, a connection indicator, and scale, tempo and volume controls.

## 5. Future scope

Future scope: the same tiny module fits any toy. Plushies that sing when squeezed, tug ropes that crescendo, cat toys, health and activity insights for owners and vets, multiple toys jamming as a band, and sensory / therapy toys for kids and senior dogs.

## 6. Thank you!

Thank you! Pawdio: every fetch is a song. Built by Laksh, Adarsh, Aryash and Ankit. Happy to take questions or show a live demo.
