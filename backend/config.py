import mediapipe as mp
from collections import deque
from utils import get_settings

class Config:
    def __init__(self):
        self.shutdown = False
        self.practice_mode = False
        self.new_action = False

        self.mp_face_detection = mp.solutions.face_detection
        self.mp_face_mesh = mp.solutions.face_mesh

        settings = get_settings()

        adv_parameters = settings['adv_parameters']
        action_parameters = settings['action_parameters']

        self.face_detection_confidence = adv_parameters.get('face_detection_confidence', 0.2)
        self.face_mesh_confidence = adv_parameters.get('face_mesh_confidence', 0.5)
        self.face_mesh_tracking = adv_parameters.get('face_mesh_tracking', 0.5)
        self.time_window = adv_parameters.get('time_window', 0.3)

        self.face_detection = self.mp_face_detection.FaceDetection(min_detection_confidence=self.face_detection_confidence)
        self.face_mesh = self.mp_face_mesh.FaceMesh(static_image_mode=False,
            max_num_faces=1, min_detection_confidence=self.face_mesh_confidence, min_tracking_confidence=self.face_mesh_tracking)

        self.time_interval = self.time_window  # Time window for average vector calculation in seconds
        self.magnitude_threshold = adv_parameters.get('magnitude_threshold', 0.1)  # Threshold magnitude to trigger action
        self.vector_window = deque()  # Store vectors with timestamps
        self.last_trigger_time = 0
        self.action_cooldown = adv_parameters.get('action_cooldown', 0.5)  # Cooldown period of 1 second
        self.up_action = action_parameters.get('up_action', "up")
        self.up_right_action = action_parameters.get('up_right_action', "none")
        self.up_left_action = action_parameters.get('up_left_action', "none")
        self.down_action = action_parameters.get('down_action', "down")
        self.down_right_action = action_parameters.get('down_right_action', "none")
        self.down_left_action = action_parameters.get('down_left_action', "none")
        self.left_action = action_parameters.get('left_action', "left")
        self.right_action = action_parameters.get('right_action', "right")