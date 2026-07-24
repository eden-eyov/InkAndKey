import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { setUnauthorizedHandler } from '../services/api';
import { useDispatch } from 'react-redux';
import { clearClubs } from '../store/clubsSlice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    dispatch(clearClubs());
  }, [dispatch]);

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

  const updateUser = (updatedUserData) => {
    setUser((currentUser) => {
      if (!currentUser) return updatedUserData;

      return {
        ...currentUser,
        ...updatedUserData,
      };
    });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(
        'LOGOUT ERROR:',
        error.response?.data || error.message
      );
    } finally {
      clearSession();
    }
  };
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateUser, loading, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
