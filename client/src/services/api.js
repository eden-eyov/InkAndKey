import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
});

let unauthorizedHandler = null;
let refreshRequest = null;

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
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';

    const isAuthFormRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/google');

    const isRefreshRequest =
      requestUrl.includes('/auth/refresh-token');

    const shouldTryRefresh =
      status === 401 &&
      !originalRequest?._retry &&
      !isAuthFormRequest &&
      !isRefreshRequest;

    if (shouldTryRefresh) {
      originalRequest._retry = true;

      try {
        if (!refreshRequest) {
          refreshRequest = axios.post(
            `${baseURL}/auth/refresh-token`,
            {},
            {
              withCredentials: true,
              timeout: 30000,
            }
          );
        }

        const { data } = await refreshRequest;
        const newAccessToken = data.accessToken;

        localStorage.setItem('token', newAccessToken);

        originalRequest.headers =
          originalRequest.headers || {};

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');

        if (unauthorizedHandler) {
          unauthorizedHandler(refreshError);
        }

        return Promise.reject(refreshError);
      } finally {
        refreshRequest = null;
      }
    }

    return Promise.reject(error);
  }
);

export default api;