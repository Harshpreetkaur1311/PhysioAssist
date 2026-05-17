import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './Trainer.module.css';

const Trainer = () => {
  return (
    <>
      <Navbar />
      <div className={`container ${styles.container}`}>
        <div className={styles.hero}>
          <motion.div 
            className={styles.textContent}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1>Meet Your AI Trainer</h1>
            <p>
              Experience a new era of physical therapy. Our advanced computer vision model 
              analyzes your body mechanics in 3D space, providing clinical-grade feedback 
              from the comfort of your home.
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className={styles.statTag}>
                <span style={{fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-darker)'}}>33</span>
                <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block'}}>Keypoints Tracked</span>
              </div>
              <div className={styles.statTag}>
                <span style={{fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-darker)'}}>0</span>
                <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block'}}>Latency (ms)</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className={styles.visualContent}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <div className={styles.orbContainer}>
              <motion.div 
                className={styles.ring}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className={styles.ring2}
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className={styles.orb}
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "0 0 60px rgba(58, 90, 64, 0.4)",
                    "0 0 100px rgba(58, 90, 64, 0.6)",
                    "0 0 60px rgba(58, 90, 64, 0.4)"
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </div>

        <div className={styles.features}>
          <motion.div 
            className={styles.featureCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3>Precision Tracking</h3>
            <p>Our MediaPipe integration maps 33 distinct anatomical landmarks across your body, ensuring every angle and joint is monitored with extreme accuracy.</p>
          </motion.div>
          
          <motion.div 
            className={styles.featureCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3>Vocal Guidance</h3>
            <p>The AI trainer speaks to you. It counts your reps and gives real-time verbal corrections if your back bends or you don't go deep enough.</p>
          </motion.div>

          <motion.div 
            className={styles.featureCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3>Smart Progression</h3>
            <p>Your performance scores are saved securely. The AI understands your history and adapts feedback to help you continually progress.</p>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Trainer;
