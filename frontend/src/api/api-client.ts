import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if it's a 401 and not a login attempt
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/login')) {
      console.warn('Sesión expirada o inválida. Redirigiendo a login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=true';
    }

    // Log 403 errors (Forbidden - wrong role)
    if (error.response?.status === 403) {
      console.error('Permiso denegado:', error.response.data?.message);
    }

    return Promise.reject(error);
  },
);

export default api;
