import os
os.environ["OPENCV_VIDEOIO_MSMF_ENABLE_HW_TRANSFORMS"] = "0"
import cv2
import imutils
import websockets
import asyncio
import base64
import os
import json
from config import Config
from websockets.exceptions import ConnectionClosedError
from utils import process_frame

config = Config()

async def send_frames(websocket):
    global config
    cap = cv2.VideoCapture(0)
    previous_landmarks = None

    try:
        while True:
            # Check if the WebSocket is open before proceeding
            if websocket.open:
                try:
                    # Capture frame-by-frame
                    if not cap.isOpened():
                        cap.open(0)
                    ret, frame = cap.read()
                    
                    if not ret:
                        print("Failed to capture frame. Skipping...")
                        await asyncio.sleep(0.1)
                        continue
                    
                    # Resize and process the frame
                    frame = imutils.resize(frame, width=720)
                    previous_landmarks = process_frame(frame, previous_landmarks, config)
                    
                    # Encode the frame as JPEG
                    _, buffer = cv2.imencode('.jpg', frame)
                    frame_base64 = base64.b64encode(buffer).decode('utf-8')
                    
                    # Send the practice log message if it exists
                    if config.practice_mode and config.new_action:
                        await websocket.send(json.dumps(config.practice_log_message))
                        config.new_action = False

                    # Prepare the frame message
                    frame_message = {
                        "type": "frame",
                        "data": f'{frame_base64}'
                    }
                    # Send the frame as JSON
                    await websocket.send(json.dumps(frame_message))

                except ConnectionClosedError:
                    print("Connection closed. Waiting for reconnection...")
                    await asyncio.sleep(1)
                except Exception as e:
                    print(f"Unexpected error during frame processing: {e}")
                    await asyncio.sleep(1)
            else:
                # if cap not released, release it
                if cap.isOpened():
                    cap.release()
                await asyncio.sleep(1)
    finally:
        print("Releasing camera resource.")
        cap.release()
        os.remove('socket_port.txt')

async def handle_commands(websocket):
    global config
    async for message in websocket:
        if message == "update":
            # reload settings
            config = Config()
            print("Updating settings")
        elif message == "shutdown":
            config.shutdown = True
            with open('shutdown.txt', 'w') as f:
                f.write("shutdown")
            print("Shutdown command received")
        elif message == "practice-enabled":
            config.practice_mode = True
            print("Practice mode enabled")
        elif message == "practice-disabled":
            config.practice_mode = False
            print("Practice mode disabled")

async def handler(websocket, path):
    print("Client connected")
    await asyncio.gather(
        send_frames(websocket),
        handle_commands(websocket)
    )

async def main():
    server = await websockets.serve(handler, "localhost", 0)
    # write socket port to local file
    with open('socket_port.txt', 'w') as f:
        f.write(str(server.sockets[0].getsockname()[1]))
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())