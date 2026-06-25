import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();

      if (!['/login', '/register'].includes(location.pathname)) {
        navigate('/login', {
          replace: true,
          state: {
            from: location,
            sessionExpired: true,
          },
        });
      }
    });

    return () => setUnauthorizedHandler(null);
  }, [clearSession, location, navigate]);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');

        // Supports both possible backend response shapes:
        // { data: user } or { user: user }
        setUser(data.data || data.user);
      } catch (error) {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    checkLoggedInUser();
  }, [clearSession]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    clearSession();
  };
  const isAuthenticated = Boolean(user);
  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
