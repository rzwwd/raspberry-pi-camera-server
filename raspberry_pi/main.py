import io
import socket
import struct
import time
import picamera
import argparse

parser = argparse.ArgumentParser(description='Streaming video from Raspberry Pi.')
parser.add_argument("-width", type=int, default=640, help="Width of frame.")
parser.add_argument("-height", type=int, default=480, help="Height of frame.")
parser.add_argument("-fps", type=int, default=30, help="FPS from cam.")
parser.add_argument("-ip", type=str, default="192.168.1.101", help="WebSocket (computer) server ip address.")
parser.add_argument("-port", type=int, default=2282, help="WebSocket (computer) port.")
parser.add_argument("-vflip", type=int, default=1, help="Frame vertical flip.")
parser.add_argument("-hflip", type=int, default=0, help="Frame horizontal flip.")
parser.add_argument("-timeout", type=int, default=1, help="Timeout for connection to server in seconds.")
args = vars(parser.parse_args())

def connect():
    while True:
        try:
            client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client_socket.connect((args["ip"], args["port"]))
            connection = client_socket.makefile('wb')
            print(201)
            return connection, client_socket
        except ConnectionRefusedError:
            time.sleep(args["timeout"])
            print(503)
        else:
            break

def tryToSend(connection, client_socket):
    try:
        with picamera.PiCamera() as camera:
            print(200)
            vflip = True if args["vflip"] == 1 else False
            hflip = True if args["hflip"] == 1 else False
            camera.vflip = vflip
            camera.hflip = hflip
            camera.resolution = (args["width"], args["height"])
            camera.framerate = args["fps"]
            time.sleep(args["timeout"])
            start = time.time()
            stream = io.BytesIO()

            try:
                for foo in camera.capture_continuous(stream, 'jpeg', use_video_port=True):
                        connection.write(struct.pack('<L', stream.tell()))
                        connection.flush()
                        stream.seek(0)
                        connection.write(stream.read())
                        stream.seek(0)
                        stream.truncate()

                connection.write(struct.pack('<L', 0))
            except BrokenPipeError:
                print(203)
                pass

    finally:
        try:
            connection.close()
        except BrokenPipeError:
            print(203)
            pass
        client_socket.close()
        print(600)
        v1, v2 = connect()
        tryToSend(v1, v2)

v1, v2 = connect()
tryToSend(v1, v2)
