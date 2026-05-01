import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import styles from './App.module.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Session from './pages/Session';
import HowItWorks from './pages/HowItWorks';
import Trainer from './pages/Trainer';

// Navbar is mostly persistent across unauthenticated pages, but we can put it inside the routes
// For simplicity, we'll let each page handle its own layout (like Navbar inclusion)
// Home has its own Navbar. Dashboard has its own header.

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className={styles.app}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/trainer" element={<Trainer />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/session" 
            element={
              <ProtectedRoute>
                <Session />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
