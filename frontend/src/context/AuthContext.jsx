import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('physio_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Verify the stored JWT is still valid by hitting /api/auth/me
        fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${parsed.token}` },
        })
          .then((res) => {
            if (res.ok) {
              setUser(parsed);
            } else {
              // Token expired — clear storage
              localStorage.removeItem('physio_user');
            }
          })
          .catch(() => {
            // Backend unreachable — keep user logged in from cache
            setUser(parsed);
          })
          .finally(() => setLoading(false));
      } catch (e) {
        console.error('Failed to parse user data', e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('physio_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('physio_user');
  };

  /**
   * Helper: return the Authorization header for API calls.
   * Usage: fetch(url, { headers: getAuthHeader() })
   */
  const getAuthHeader = () => ({
    Authorization: user?.token ? `Bearer ${user.token}` : '',
    'Content-Type': 'application/json',
  });

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, getAuthHeader }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
