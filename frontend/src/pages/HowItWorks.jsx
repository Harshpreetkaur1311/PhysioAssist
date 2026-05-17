import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Camera, Activity, Award } from 'lucide-react';
import styles from './HowItWorks.module.css';

const HowItWorks = () => {
  const navigate = useNavigate();
  
  const steps = [
    {
      icon: <Camera size={28} />,
      title: "Set up your camera",
      desc: "Place your device so your full body is visible. No special equipment needed, just your webcam."
    },
    {
      icon: <Activity size={28} />,
      title: "Perform your routine",
      desc: "Follow the guided exercises. Our AI tracks your movements in real-time to analyze your form."
    },
    {
      icon: <Award size={28} />,
      title: "Get instant feedback",
      desc: "Receive actionable insights on your posture, depth, and reps to improve your performance."
    }
  ];

  return (
    <>
      <Navbar />
      <div className={`container ${styles.container}`}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>How It Works</h1>
          <p>Your journey to perfect form and recovery is just three simple steps away. Let our AI guide you through every movement.</p>
        </motion.div>

        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              className={styles.stepCard}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className={styles.stepNumber}>0{index + 1}</div>
              <div className={styles.stepContent}>
                <div className={styles.icon}>
                  {step.icon}
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className={styles.cta}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <button onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
            Start Your First Session
          </button>
        </motion.div>
      </div>
      <Footer />
    </>
  );
};

export default HowItWorks;
