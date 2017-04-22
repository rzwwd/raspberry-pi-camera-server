# raspberry-pi-camera-server
Web server for streaming video on Raspberry Pi

## Install
Copy folder raspberry_pi to Raspberry Pi.

On computer:
```sh
git clone https://github.com/exelban/raspberry-pi-camera-server

cd raspberry-pi-camera-server

npm install
npm run build
npm run start
```

On Raspberry Pi:
```sh
python3 drive.py
python3 main.py
```
