import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true,
});

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url;
    const isAuthFormRequest =
      requestUrl?.includes('/auth/login') ||
      requestUrl?.includes('/auth/register') ||
      requestUrl?.includes('/auth/google');

    if (status === 401 && !isAuthFormRequest) {
      localStorage.removeItem('token');

      if (unauthorizedHandler) {
        unauthorizedHandler(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
