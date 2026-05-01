import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from './Hero.module.css';

const Hero = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const y2 = useTransform(scrollY, [0, 500], [0, -50]);

  return (
    <section className={styles.hero}>
      <div className="container">
        <motion.p 
          className={styles.subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Online & Offline
        </motion.p>
        <motion.h1 
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          AI-Powered<br/><span>Physical Therapy</span>
        </motion.h1>

        <motion.div 
          className={styles.imageContainer}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <motion.img 
            src="/images/hero.png" 
            alt="Serene Therapy Room" 
            className={styles.image}
            style={{ y: y1 }}
          />
          <div className={styles.imageOverlay}></div>
          
          <motion.div 
            className={styles.infoTag}
            style={{ y: y2 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <h4>What is PhysioAssist?</h4>
            <p>PhysioAssist is a safe and supportive AI agent where you can track, correct, and improve your posture during exercises in real-time.</p>
          </motion.div>

          <div className={styles.actionWrapper}>
            <button className="btn-primary" onClick={() => navigate('/trainer')}>Meet AI Trainer</button>
            <button className="btn-primary" onClick={() => navigate('/how-it-works')}>How it works</button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
