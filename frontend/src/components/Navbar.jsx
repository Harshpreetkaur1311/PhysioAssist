import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.header 
      className="container"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo} style={{ textDecoration: 'none' }}>PhysioAssist</Link>
        
        <div className={styles.links}>
          <Link to="/how-it-works" className={styles.link}>How it works</Link>
          <a href="#features" className={styles.link}>Features</a>
          <Link to="/trainer" className={styles.link}>About AI</Link>
        </div>

        <div className={styles.actions}>
          {user ? (
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>Dashboard</button>
          ) : (
            <>
              <button className="btn-outline" onClick={() => navigate('/login')}>Log in</button>
              <button className="btn-primary" onClick={() => navigate('/login')}>Start Session</button>
            </>
          )}
        </div>
      </nav>
    </motion.header>
  );
};

export default Navbar;
