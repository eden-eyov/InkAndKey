import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  // When the app loads, check if there is a saved token.
  // If there is, ask the backend who the logged-in user is.
  useEffect(() => {
    const checkLoggedInUser = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // SERVER TODO:
        // Make sure the backend has GET /auth/me.
        // This route should be protected with JWT and return the logged-in user.
        const res = await api.get('/auth/me');

        // Supports both possible backend response structures:
        // { data: user } or { user: user }
        const loggedInUser = res.data.data || res.data.user;

        setUser(loggedInUser);
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedInUser();
  }, []);



  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  const isAuthenticated = Boolean(user);
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
