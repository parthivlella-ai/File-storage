import axios from 'axios';

/**
 * Determine API Base URL using VITE_API_URL
 * - In Production: Set VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api (or https://YOUR-BACKEND-DOMAIN)
 *   Guarantees the URL always routes to the backend's /api endpoint.
 * - In Local Development: When VITE_API_URL is unset, defaults to '/api' which Vite proxies to http://localhost:5000
 */
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

export const API_BASE_URL = (() => {
  if (rawApiUrl) {
    // If it's a relative path like '/api', use it directly
    if (rawApiUrl.startsWith('/')) {
      return rawApiUrl;
    }
    // If it's a full URL, guarantee it ends with '/api'
    return rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;
  }
  // Local development default (routed via Vite dev server proxy configured in vite.config.js)
  return '/api';
})();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('securehub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format error messages & handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 unauthorized
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('securehub_token');
        localStorage.removeItem('securehub_user');
        window.location.href = '/login?session=expired';
      }
    }

    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    return Promise.reject(new Error(message));
  }
);

export default api;
