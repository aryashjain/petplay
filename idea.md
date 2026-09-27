"Build a smart dog toy from scratch, end to end. Hardware is an ESP32-C6 with an MPU six-axis accelerometer and gyroscope over I2C, powered by a small lithium battery, all sealed inside a dog ball.

Part one, firmware. Read the sensor at two hundred hertz minimum. Do light filtering on-device to reject noise but send raw-ish data so the app can interpret it. Detect impacts from acceleration spikes. Connect over Wi-Fi and stream via WebSocket in a compact binary format, with automatic reconnection and a battery-saving sleep mode when the ball is still.

Part two, the web app. Plain HTML, CSS and JavaScript, no phone app. It connects to the ball's WebSocket, and uses the Web Audio API to generate continuous piano music in real time. Impact strength maps to note velocity, rotation speed to pitch and note density, and the whole thing should stay in a pleasant musical scale so it never sounds harsh. Add a live visualiser of the motion, a connection status indicator, and controls for scale, tempo and volume.

PHASE 3 : I need you to create A GREAT PPT 
with lots of animation and dog lil gifs of dogs playingh with balls and lot more 

there should be 5-6 slide 
- Initial 2 as Story of the idea 1 having how music makes dogs go woaah
 
- Two for the TECHNICAL PARTS , good description and images of the tools used 
- 1 for the future scope how we can use it in other soft toys etc
