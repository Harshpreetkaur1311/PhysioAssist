import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useAuth } from '../context/AuthContext';
import styles from './Session.module.css';

const Session = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const webcamRef = useRef(null);
  
  const sessionData = location.state?.session;
  const exerciseType = (location.state?.exerciseType || 'squats').toLowerCase();
  
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState({ type: 'success', message: 'Initializing AI...' });
  const [isActive, setIsActive] = useState(false);

  // AI State Refs (to avoid stale closures in MediaPipe loop)
  const statsRef = useRef({
    counter: 0,
    stage: 'up',
    lastLoggedRep: 0,
    repAchievedDepth: false
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const logRepToBackend = async (repData) => {
    if (!sessionData?._id || !token) return;
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/exercises/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: sessionData._id,
          rep_number: repData.reps,
          score: repData.score,
          feedback: repData.feedback
        })
      });
    } catch (err) {
      console.error("Failed to log rep:", err);
    }
  };

  // ─── AI Processing Loop ──────────────────────────────────────────────────

  useEffect(() => {
    if (!window.Pose) return;

    const pose = new window.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults((results) => {
      if (!results.poseLandmarks) {
        setFeedback({ type: 'warning', message: 'Position yourself in view' });
        return;
      }

      const landmarks = results.poseLandmarks;
      const stats = statsRef.current;
      let repDetected = false;
      let currentFeedback = "Keep going!";
      let score = 0;

      // ─── Logic for Squats ──────────────────────────────────────────────────
      if (exerciseType.includes('squat')) {
        const hip = landmarks[24];
        const knee = landmarks[26];
        const ankle = landmarks[28];
        const shoulder = landmarks[12];

        const angle = calculateAngle(hip, knee, ankle);
        const backAngle = calculateAngle(shoulder, hip, knee);
        const depthValid = hip.y > knee.y - 0.05;

        if (angle < 105) {
          stats.stage = "down";
          if (depthValid) stats.repAchievedDepth = true;
        }

        if (angle > 150 && stats.stage === "down") {
          stats.counter += 1;
          currentFeedback = stats.repAchievedDepth && backAngle > 70 ? "Perfect Squat" : (stats.repAchievedDepth ? "Keep Back Straight" : "Go Deeper");
          score = "Perfect" in currentFeedback ? 10 : 5;
          stats.stage = "up";
          stats.repAchievedDepth = false;
          repDetected = true;
        } else {
          currentFeedback = stats.stage === "down" ? (stats.repAchievedDepth ? "Go Up" : "Go Lower") : "Stand Straight";
        }
      }

      // ─── Logic for Bicep Curls ─────────────────────────────────────────────
      else if (exerciseType.includes('curl')) {
        const s = landmarks[12];
        const e = landmarks[14];
        const w = landmarks[16];
        const angle = calculateAngle(s, e, w);

        if (angle < 40) stats.stage = "up";
        if (angle > 160 && stats.stage === "up") {
          stats.counter += 1;
          score = 10;
          currentFeedback = "Good Curl";
          stats.stage = "down";
          repDetected = true;
        } else {
          currentFeedback = stats.stage === "up" ? "Lower Arm" : "Curl Up";
        }
      }

      // ─── Logic for Lunges ──────────────────────────────────────────────────
      else if (exerciseType.includes('lunge')) {
        const h = landmarks[24];
        const k = landmarks[26];
        const a = landmarks[28];
        const angle = calculateAngle(h, k, a);

        if (angle < 110) stats.stage = "down";
        if (angle > 160 && stats.stage === "down") {
          stats.counter += 1;
          score = 10;
          currentFeedback = "Great Lunge";
          stats.stage = "up";
          repDetected = true;
        } else {
          currentFeedback = stats.stage === "up" ? "Drop Hips" : "Push Up";
        }
      }

      // Update UI
      setReps(stats.counter);
      setFeedback({ type: score >= 7 || stats.stage === 'down' ? 'success' : 'warning', message: currentFeedback });

      if (repDetected) {
        speak(stats.counter);
        logRepToBackend({ reps: stats.counter, score, feedback: currentFeedback });
      }
    });

    let camera = null;
    if (webcamRef.current) {
      camera = new window.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await pose.send({ image: webcamRef.current.video });
        },
        width: 1280,
        height: 720
      });
      camera.start().then(() => {
        setIsActive(true);
        speak(`Starting ${exerciseType} session.`);
      });
    }

    return () => {
      if (camera) camera.stop();
      pose.close();
    };
  }, [exerciseType]);

  const handleEndSession = () => navigate('/dashboard');

  return (
    <div className={styles.sessionContainer}>
      <header className={styles.sessionHeader}>
        <button className={styles.backBtn} onClick={handleEndSession}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.headerInfo}>
          <h2 style={{textTransform: 'capitalize'}}>{exerciseType} Tracking</h2>
          <span className={styles.badge}>Live Session</span>
        </div>
        <div className={styles.statusIndicator}>
          <div className={styles.pulse}></div>
          {isActive ? 'AI Active' : 'Initializing...'}
        </div>
      </header>

      <div className={styles.webcamWrapper}>
        <Webcam 
          ref={webcamRef}
          audio={false}
          className={styles.webcam}
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
        />
        
        <div className={styles.overlayContainer}>
          <motion.div 
            key={reps}
            className={styles.counterOverlay}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className={styles.counterLabel}>REPS</div>
            <div className={styles.counterValue}>{reps}</div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={feedback.message}
              className={`${styles.feedbackOverlay} ${styles[feedback.type]}`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
            >
              {feedback.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              <span>{feedback.message}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Session;
