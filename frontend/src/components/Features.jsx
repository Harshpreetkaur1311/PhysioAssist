import { motion } from 'framer-motion';
import { Activity, Bone, Volume2, ShieldCheck } from 'lucide-react';
import styles from './Features.module.css';

const Features = () => {
  const features = [
    {
      icon: <Activity />,
      title: "Real-time Tracking",
      subtitle: "30 FPS Analysis",
      desc: "Our MediaPipe integration runs lightning-fast pose estimation locally on your device without lag."
    },
    {
      icon: <Bone />,
      title: "Joint Mapping",
      subtitle: "33 3D Landmarks",
      desc: "Accurately maps shoulders, hips, and knees to ensure your depth and form are perfect."
    },
    {
      icon: <Volume2 />,
      title: "Vocal Feedback",
      subtitle: "AI Audio Guide",
      desc: "Hands-free experience with an AI voice telling you to 'Go Down', 'Go Up', or 'Stand Straight'."
    },
    {
      icon: <ShieldCheck />,
      title: "Privacy First",
      subtitle: "No Cloud Uploads",
      desc: "All video processing and pose estimation is done client-side. Your video never leaves your computer."
    }
  ];

  return (
    <section className={styles.features} id="features">
      <div className="container">
        <motion.h2 
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          Meet our AI features
        </motion.h2>

        <div className={styles.list}>
          {features.map((feat, index) => (
            <motion.div 
              className={styles.item} 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={styles.itemLeft}>
                <div className={styles.avatar}>{feat.icon}</div>
                <div className={styles.details}>
                  <h4>{feat.title}</h4>
                  <p>{feat.subtitle}</p>
                </div>
              </div>
              <div className={styles.itemRight}>
                {feat.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
