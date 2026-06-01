import axios from 'axios';

// Create a custom Axios instance for all backend requests
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically add the JWT token to every request header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle global API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url;

    // If the token is invalid or expired, clear it.
    // We avoid redirecting when the failed request is already login/register.
    if (
      status === 401 &&
      !requestUrl?.includes('/auth/login') &&
      !requestUrl?.includes('/auth/register')
    ) {
      localStorage.removeItem('token');
    }

    return Promise.reject(error);
  }
);

export default api;