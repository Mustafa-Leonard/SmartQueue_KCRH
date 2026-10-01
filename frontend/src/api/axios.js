import axios from 'axios';
import { API_BASE_URL } from '../utils/constants.js';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let refreshPromise = null;

const normalizeApiError = (error) => {
  const responseData = error.response?.data;
  const message = responseData?.message;
  const details = Array.isArray(responseData?.errors) ? responseData.errors.filter(Boolean) : [];
  if (message) error.message = details.length ? `${message}: ${details.join('; ')}` : message;
  return error;
};

// Request Interceptor: Attach authorization headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Manage token refreshes and route redirects
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestPath = originalRequest?.url?.split('?')[0] || '';
    const publicAuthRequest = /^\/auth\/(login|register|refresh|forgot-password|reset-password)$/.test(requestPath);

    if (error.response?.status === 401 && originalRequest && !publicAuthRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const rToken = localStorage.getItem('refreshToken');
        if (!rToken) throw new Error('No refresh token');

        if (!refreshPromise) {
          refreshPromise = axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: rToken })
            .then((response) => {
              const tokens = response.data.data;
              localStorage.setItem('accessToken', tokens.accessToken);
              if (tokens.refreshToken) localStorage.setItem('refreshToken', tokens.refreshToken);
              return tokens;
            })
            .finally(() => { refreshPromise = null; });
        }
        const { accessToken } = await refreshPromise;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(normalizeApiError(err));
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

// Public axios instance (no auth interceptor) for public pages like DisplayBoard
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

publicApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error))
);

export default api;
