import json
import time
import numpy as np
import cv2
import pyautogui

def get_settings():
    # assert(os.path.exists('settings.json'))
    with open('../electron/settings.json', 'r') as f:
        return json.load(f)

def vector_magnitude(vector):
    return np.sqrt(vector[0] ** 2 + vector[1] ** 2)

def average_vector(vectors):
    if not vectors:
        return np.array([0, 0])
    return np.mean(vectors, axis=0)

def clean_old_vectors(current_time, config):
    while config.vector_window and (current_time - config.vector_window[0][0]) > config.time_interval:
        config.vector_window.popleft()

def determine_direction(vector):
    angle = np.arctan2(vector[1], vector[0]) * 180 / np.pi

    if -22.5 < angle <= 22.5:
        return "left"
    elif 22.5 < angle <= 67.5:
        return "up_right"
    elif 67.5 < angle <= 112.5:
        return "down"
    elif 112.5 < angle <= 157.5:
        return "up_left"
    elif angle > 157.5 or angle <= -157.5:
        return "right"
    elif -157.5 < angle <= -112.5:
        return "down_left"
    elif -112.5 < angle <= -67.5:
        return "up"
    elif -67.5 < angle <= -22.5:
        return "down_right"
    
    return "Center"

def detect_and_draw_landmarks(frame, mesh_results, predictor):
    # return landmarks if detected, otherwise return None, also draw the landmarks on the frame
    if mesh_results.multi_face_landmarks:
        for face_landmarks in mesh_results.multi_face_landmarks:
            for i, landmark in enumerate(face_landmarks.landmark):
                h, w, _ = frame.shape
                x, y = int(landmark.x * w), int(landmark.y * h)
                cv2.circle(frame, (x, y), 2, (0, 255, 0), -1)
    return mesh_results.multi_face_landmarks

def do_action(direction, config):
    # get associated action with the direction and execute it
    action = getattr(config, f"{direction}_action", "none")

    direction = direction.replace('_', ' ')
    direction = direction.capitalize()

    config.new_action = True
    config.last_trigger_time = time.time()
    if config.practice_mode:
        config.practice_log_message = {
            "type": "practice-log",
            "data": f"{direction} action triggered"
        }
        return

    # either action = {'text': ["keystopress"]} or action = {'command': ["commnads", "to", "run"]}
    if action.get('text'):
        pyautogui.typewrite(''.join(action['text']))  # Ensure it's a string
    elif action.get('command'):
        # change keyboard to pyautgui mappings, so Control becomes ctrl, etc.
        dict = {'Control': 'ctrl', 'Shift': 'shift', 'Alt': 'alt', 'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right'}
        action['command'] = [dict.get(i, i) for i in action['command']]
        pyautogui.hotkey(*action['command'])

def calculate_movement(landmarks, previous_landmarks, current_time, frame, config):
    # Calculate the movement vector based on the landmarks
    # Extract nose coordinates from landmarks

    nose_x, nose_y = landmarks.landmark[1].x, landmarks.landmark[1].y
    previous_nose_x, previous_nose_y = previous_landmarks.landmark[1].x, previous_landmarks.landmark[1].y

    # Calculate movement vector from previous nose coordinates
    movement_vector = (nose_x - previous_nose_x, nose_y - previous_nose_y)

    # Add current vector and timestamp to the deque
    config.vector_window.append((current_time, movement_vector))

    # Clean old vectors
    clean_old_vectors(current_time, config)

    # Compute average vector over the time window
    avg_vector = average_vector([vec for _, vec in config.vector_window])
    avg_magnitude = vector_magnitude(avg_vector)

    # Draw movement vector
    # Get the frame dimensions
    h, w, _ = frame.shape

    # Convert normalized coordinates to actual pixel coordinates
    start_point = (int(previous_nose_x * w), int(previous_nose_y * h))
    end_point = (int(nose_x * w), int(nose_y * h))
    cv2.arrowedLine(frame, start_point, end_point, (255, 0, 0), 2)  # Red arrow for movement

    # Determine direction based on average vector
    direction = determine_direction(avg_vector)

    if avg_magnitude > config.magnitude_threshold and ((current_time - config.last_trigger_time) > config.action_cooldown):
        do_action(direction, config)


def process_frame(frame, previous_landmarks, config):
    # Convert the frame to RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Detect faces in the frame using FaceDetection
    face_detection_results = config.face_detection.process(rgb_frame)
    landmarks = None

    if face_detection_results.detections:
        for detection in face_detection_results.detections:
            bboxC = detection.location_data.relative_bounding_box
            h, w, _ = frame.shape
            x, y, width, height = int(bboxC.xmin * w), int(bboxC.ymin * h), int(bboxC.width * w), int(bboxC.height * h)
            cv2.rectangle(frame, (x, y), (x + width, y + height), (255, 0, 0), 2)  # Draw bounding box

            # Get facial landmarks using FaceMesh
            landmarks = detect_and_draw_landmarks(frame, config.face_mesh.process(rgb_frame), None)
            landmarks = landmarks[0] if landmarks else None

            # Calculate movement vector based on the landmarks
            if previous_landmarks and landmarks:
                calculate_movement(landmarks, previous_landmarks, time.time(), frame, config)

    # if landmarks not none, return landmarks, otherwise return previous_landmarks
    return landmarks if landmarks else previous_landmarks