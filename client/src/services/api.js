import axios from 'axios';

// Create a custom instance of Axios with the Backend base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Adjust the port if your backend runs on a different one
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

export default api;