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

let isRefreshing = false;
// Peticiones que esperan a que termine el refresh del token.
let failedQueue: {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no es auth/login o auth/refresh
    if (error.response?.status === 401 && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh') && !originalRequest._retry) {
      
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      // Necesitamos el userId, podemos decodificar el JWT o hacer que el servidor devuelva solo accessToken, pero el endpoint actual pide userId
      // Si decodificamos el JWT:
      const accessTokenStr = localStorage.getItem('token');
      let userId = '';
      if (accessTokenStr) {
        try {
          const payload = JSON.parse(atob(accessTokenStr.split('.')[1]));
          userId = payload.sub;
        } catch {
          // Token mal formado: se sigue sin userId y no se intenta refrescar.
        }
      }

      if (refreshToken && userId) {
        if (isRefreshing) {
          return new Promise(function(resolve, reject) {
            failedQueue.push({resolve, reject});
          }).then(token => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return api(originalRequest);
          }).catch(err => Promise.reject(err));
        }

        isRefreshing = true;

        try {
          // Intentamos refrescar
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            userId,
            refreshToken
          });
          
          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken;
          
          localStorage.setItem('token', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
          originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;
          
          processQueue(null, newAccessToken);
          isRefreshing = false;
          
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          // Si falla el refresh, forzamos logout
          console.warn('Refresh falló. Redirigiendo a login...');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?expired=true';
          }
          return Promise.reject(refreshError);
        }
      } else {
          // No hay refresh token
          console.warn('Sesión expirada sin token. Redirigiendo a login...');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?expired=true';
          }
      }
    }

    if (error.response?.status === 403) {
      console.error('Permiso denegado:', error.response.data?.message);
    }

    return Promise.reject(error);
  },
);

export default api;
