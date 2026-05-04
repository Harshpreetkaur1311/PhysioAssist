import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import threading
import queue
import time
import json
import os
import requests

# ─── Constants ──────────────────────────────────────────────────────────────
BACKEND_URL = "http://localhost:5000"
# Absolute path to the root context file
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
CTX_FILE = os.path.join(ROOT_DIR, "session_context.json")

# ─── Speech System ──────────────────────────────────────────────────────────
speech_queue = queue.Queue()

def speak_worker():
    import subprocess
    while True:
        text = speech_queue.get()
        if text is None: break
        try:
            subprocess.run(
                ["powershell", "-Command", 
                 f"Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('{text}')"],
                creationflags=subprocess.CREATE_NO_WINDOW
            )
        except Exception as e:
            print("Speech error:", e)
        finally:
            speech_queue.task_done()

threading.Thread(target=speak_worker, daemon=True).start()

def speak(text):
    speech_queue.put(text)

# ─── Angle Calculation ──────────────────────────────────────────────────────
def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    if angle > 180.0: angle = 360-angle
    return angle

# ─── Exercise Trackers ──────────────────────────────────────────────────────
class ExerciseTracker:
    def __init__(self):
        self.counter = 0
        self.stage = "up"
        self.feedback = "Get Ready"
        self.score = 0

    def process(self, landmarks):
        raise NotImplementedError()

    def get_stats(self):
        return {"reps": self.counter, "stage": self.stage, "feedback": self.feedback, "score": self.score}

class SquatTracker(ExerciseTracker):
    def __init__(self):
        super().__init__()
        self.rep_achieved_depth = False

    def process(self, landmarks):
        hip, knee, ankle, shoulder = [landmarks[24].x, landmarks[24].y], [landmarks[26].x, landmarks[26].y], [landmarks[28].x, landmarks[28].y], [landmarks[12].x, landmarks[12].y]
        angle, back_angle = calculate_angle(hip, knee, ankle), calculate_angle(shoulder, hip, knee)
        depth_valid = hip[1] > knee[1] - 0.05
        if angle < 105:
            self.stage = "down"
            if depth_valid: self.rep_achieved_depth = True
        if angle > 150 and self.stage == "down":
            self.counter += 1
            self.feedback = "Perfect Squat" if self.rep_achieved_depth and back_angle > 70 else ("Back Bent" if self.rep_achieved_depth else "Go Lower")
            self.score += 10 if "Perfect" in self.feedback else (5 if "Back" in self.feedback else 3)
            self.stage = "up"; self.rep_achieved_depth = False
            return True
        self.feedback = ("Go Up" if self.rep_achieved_depth else "Go Lower") if self.stage == "down" else "Stand Straight"
        return False

class BicepCurlTracker(ExerciseTracker):
    def process(self, landmarks):
        s, e, w = [landmarks[12].x, landmarks[12].y], [landmarks[14].x, landmarks[14].y], [landmarks[16].x, landmarks[16].y]
        angle = calculate_angle(s, e, w)
        if angle < 40: self.stage = "up"
        if angle > 160 and self.stage == "up":
            self.counter += 1; self.score += 10; self.feedback = "Good Curl"; self.stage = "down"
            return True
        self.feedback = "Lower Arm" if self.stage == "up" else "Curl Up"
        return False

class LungeTracker(ExerciseTracker):
    def process(self, landmarks):
        h, k, a = [landmarks[24].x, landmarks[24].y], [landmarks[26].x, landmarks[26].y], [landmarks[28].x, landmarks[28].y]
        angle = calculate_angle(h, k, a)
        if angle < 110: self.stage = "down"
        if angle > 160 and self.stage == "down":
            self.counter += 1; self.score += 10; self.feedback = "Great Lunge"; self.stage = "up"
            return True
        self.feedback = "Drop Hips" if self.stage == "up" else "Push Up"
        return False

# ─── Main Engine ───────────────────────────────────────────────────────────
class PhysioEngine:
    def __init__(self):
        self.active_session = None
        self.tracker = None
        self.detector = self._init_detector()

    def _init_detector(self):
        base_options = python.BaseOptions(model_asset_path="pose_landmarker_lite.task")
        options = vision.PoseLandmarkerOptions(base_options=base_options, running_mode=vision.RunningMode.VIDEO)
        return vision.PoseLandmarker.create_from_options(options)

    def log_rep(self, stats):
        if not self.active_session: return
        payload = {"session_id": self.active_session["session_id"], "rep_number": stats["reps"], "score": stats["score"], "feedback": stats["feedback"]}
        def _post():
            try: requests.post(f"{BACKEND_URL}/api/exercises/log", json=payload, headers={"Authorization": f"Bearer {self.active_session['token']}"}, timeout=2)
            except: pass
        threading.Thread(target=_post, daemon=True).start()

    def wait_for_session(self):
        print(f"[STANDBY] AI Engine standby... Waiting for session in {ROOT_DIR}")
        while True:
            if os.path.exists(CTX_FILE):
                try:
                    with open(CTX_FILE, "r") as f: ctx = json.load(f)
                    self.active_session = ctx
                    etype = ctx.get("exercise_type", "squats").lower()
                    if "squat" in etype: self.tracker = SquatTracker()
                    elif "curl" in etype: self.tracker = BicepCurlTracker()
                    elif "lunge" in etype: self.tracker = LungeTracker()
                    else: self.tracker = SquatTracker()
                    
                    print(f"[START] Session Starting: {etype.upper()} for {ctx.get('user_name')}")
                    speak(f"Starting {etype} session.")
                    os.remove(CTX_FILE)
                    self.start_webcam()
                except Exception as e:
                    print(f"Error: {e}")
            time.sleep(1)

    def start_webcam(self):
        cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        last_timestamp_ms = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            frame = cv2.flip(frame, 1)
            display_frame = frame.copy()
            
            timestamp_ms = int(time.time() * 1000)
            if timestamp_ms <= last_timestamp_ms: timestamp_ms = last_timestamp_ms + 1
            last_timestamp_ms = timestamp_ms

            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            results = self.detector.detect_for_video(mp_image, timestamp_ms)

            if results.pose_landmarks:
                landmarks = results.pose_landmarks[0]
                if self.tracker.process(landmarks):
                    stats = self.tracker.get_stats()
                    self.log_rep(stats)
                    speak(f"{stats['reps']}")
                
            # No longer displaying window - UI is in the browser
            if cv2.waitKey(1) & 0xFF == ord('q'): break

        cap.release()
        self.active_session = None
        print("[END] Session ended. Back to standby.")

if __name__ == "__main__":
    engine = PhysioEngine()
    engine.wait_for_session()
