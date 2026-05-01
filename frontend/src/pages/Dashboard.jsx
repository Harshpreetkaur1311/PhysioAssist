import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Activity, Flame, Trophy, Play } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_reps_lifetime: 0,
    total_sessions: 0,
    streak_days: 0,
    weekly_progress: []
  });
  const [selectedExercise, setSelectedExercise] = useState('squats');
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/exercises/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchStats();
  }, [token]);

  const handleStartSession = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ exercise_type: selectedExercise })
      });
      
      if (response.ok) {
        const session = await response.json();
        navigate('/session', { state: { session, exerciseType: selectedExercise } });
      }
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h2>Welcome back, {user?.name || "User"}!</h2>
            <p className={styles.subtitle}>Ready to crush your goals today?</p>
          </div>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={20} />
          Logout
        </button>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{background: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b'}}>
            <Flame size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.streak_days} Days</h3>
            <p>Current Streak</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{background: 'rgba(144, 255, 126, 0.1)', color: 'var(--primary)'}}>
            <Activity size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.total_sessions} Sessions</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{background: 'rgba(77, 171, 247, 0.1)', color: '#4dabf7'}}>
            <Trophy size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.total_reps_lifetime}</h3>
            <p>Total Reps</p>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.chartSection}>
          <div className={styles.sectionHeader}>
            <h3>Activity Progress</h3>
          </div>
          <div className={styles.chartPlaceholder}>
            {stats.weekly_progress.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weekly_progress}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="reps" radius={[6, 6, 0, 0]}>
                    {stats.weekly_progress.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === stats.weekly_progress.length - 1 ? 'var(--primary)' : 'rgba(0,0,0,0.1)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>No activity data yet. Start a session!</div>
            )}
          </div>
        </div>

        <div className={styles.actionSection}>
          <div className={styles.startCard}>
            <h3>New Workout</h3>
            <p>Select your exercise and start AI tracking</p>
            
            <div className={styles.exerciseSelect}>
              <label>Exercise Type</label>
              <select 
                value={selectedExercise} 
                onChange={(e) => setSelectedExercise(e.target.value)}
              >
                <option value="squats">Squats</option>
                <option value="bicep curls">Bicep Curls</option>
                <option value="lunges">Lunges</option>
              </select>
            </div>

            <button className="btn-primary" onClick={handleStartSession}>
              <Play size={20} fill="currentColor" />
              Start Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
