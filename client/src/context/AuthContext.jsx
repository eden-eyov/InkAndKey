import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
const [user, setUser] = useState({ name: "Eden", email: "eden@example.com" });
//   const [loading, setLoading] = useState(true);
const [loading, setLoading] = useState(false);

  // When the app loads, check if there's a token in local storage
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Verify token with the backend to restore user session
      api.get('/auth/me')
        .then(res => {
          // Assuming the backend returns the user object inside res.data.data or res.data.user
          setUser(res.data.data || res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);