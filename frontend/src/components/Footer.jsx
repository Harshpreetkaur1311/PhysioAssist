import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './Footer.module.css';

const Footer = () => {
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0.8, 1], [0.95, 1.05]);

  return (
    <footer className={styles.footer}>
      <div className="container">
        
        <div className={styles.portalContainer}>
          <motion.img 
            src="/images/portal.png" 
            alt="Nature Portal" 
            className={styles.portalImage}
            style={{ scale }}
          />
          <motion.div 
            className={styles.portalContent}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2>Recovery isn't always a straight line. Let AI guide your <span>steps</span>.</h2>
            <button className="btn-primary">Try Session</button>
          </motion.div>
        </div>

        <div className={styles.bottomNav}>
          <div className={styles.logo}>PhysioAssist</div>
          <div className={styles.copyright}>© 2026 PhysioAssist. All rights reserved.</div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
