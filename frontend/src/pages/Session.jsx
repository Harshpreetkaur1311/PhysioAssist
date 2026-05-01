import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle, Scan } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Session.module.css';

const Session = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  
  const sessionData = location.state?.session;
  const exerciseType = location.state?.exerciseType || 'Squats';
  
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState({ type: 'success', message: 'Waiting for AI Engine...' });

  useEffect(() => {
    if (!sessionData?._id || !token) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/exercises/${sessionData._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const latestReps = data.reps || [];
          if (latestReps.length > 0) {
            const lastRep = latestReps[latestReps.length - 1];
            setReps(latestReps.length);
            setFeedback({
              type: lastRep.score >= 7 ? 'success' : 'warning',
              message: lastRep.feedback
            });
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [sessionData?._id, token]);

  const handleEndSession = () => navigate('/dashboard');

  return (
    <div className={styles.sessionContainer}>
      <header className={styles.sessionHeader}>
        <button className={styles.backBtn} onClick={handleEndSession}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.headerInfo}>
          <h2 style={{textTransform: 'capitalize'}}>{exerciseType} Tracking</h2>
          <span className={styles.badge}>Live Sync</span>
        </div>
        <div className={styles.statusIndicator}>
          <div className={styles.pulse}></div>
          AI Active
        </div>
      </header>

      <div className={styles.webcamWrapper}>
        {/* Placeholder for when AI is taking over the camera */}
        <div className={styles.aiPlaceholder}>
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Scan size={80} color="var(--primary)" strokeWidth={1} />
          </motion.div>
          <h3>AI Engine Tracking Active</h3>
          <p>Please look at the <strong>PhysioAssist AI</strong> window on your desktop.</p>
        </div>
        
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
