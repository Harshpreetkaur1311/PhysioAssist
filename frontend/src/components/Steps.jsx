import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import styles from './Steps.module.css';

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const itemVars = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const Steps = () => {
  return (
    <section className={styles.stepsSection} id="how-it-works">
      <div className="container">
        <motion.h2 
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          Few steps to <span>begin</span>
        </motion.h2>

        <motion.div 
          className={styles.grid}
          variants={containerVars}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div className={styles.card} variants={itemVars}>
            <div className={styles.iconWrapper}>
              <img src="/images/stones.png" alt="3D abstract" style={{ filter: 'brightness(2)' }} />
            </div>
            <h3 className={styles.cardTitle}>Start Webcam</h3>
            <p className={styles.cardDesc}>Connect your camera securely. All processing runs entirely on your device for total privacy.</p>
            <div className={styles.arrow}><ArrowRight size={18} color="#fff" /></div>
          </motion.div>

          <motion.div className={styles.card} variants={itemVars}>
            <div className={styles.iconWrapper}>
              <img src="/images/stones.png" alt="3D abstract" />
            </div>
            <h3 className={styles.cardTitle}>Perform Exercise</h3>
            <p className={styles.cardDesc}>Our advanced pose detection model maps your joints 30 times a second.</p>
          </motion.div>

          <motion.div className={styles.card} variants={itemVars}>
            <div className={styles.iconWrapper}>
               <img src="/images/stones.png" alt="3D abstract" style={{ filter: 'brightness(0.8)' }} />
            </div>
            <h3 className={styles.cardTitle}>Get Feedback</h3>
            <p className={styles.cardDesc}>Receive instant, real-time vocal feedback to correct your posture.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Steps;
