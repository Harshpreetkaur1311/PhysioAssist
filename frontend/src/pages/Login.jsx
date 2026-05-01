import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';
import styles from './Login.module.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Backend auth failed:', err);
        return;
      }

      const data = await res.json();

      // Store JWT + user profile in context (persisted to localStorage)
      login({
        token: data.token,
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        picture: data.user.picture,
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Network error during login:', err);
    }
  };

  const handleError = () => {
    console.error('Google Login Failed');
  };

  return (
    <div className={styles.loginContainer}>
      <motion.div 
        className={styles.loginBox}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.logoWrapper}>
          <Activity size={40} className={styles.logoIcon} />
          <h2>PhysioAssist</h2>
        </div>
        
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to continue your AI-guided physical therapy journey.</p>
        
        <div className={styles.googleButtonWrapper}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            theme="filled_black"
            size="large"
            text="continue_with"
            shape="rectangular"
          />
        </div>
        
        <div className={styles.footer}>
          <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
