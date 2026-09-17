import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isLocalUrl = !envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1');

  // 1. If VITE_API_URL is a real external URL (not localhost), use it with /api
  if (envUrl && !isLocalUrl) {
    const trimmed = envUrl.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }

  // 2. In production (Vercel), always use relative URL '/api' so API requests route
  //    to /api/* via vercel.json → Python serverless function, cleanly separated from
  //    client-side React SPA routes (/dashboard, /expenses, /budgets, etc.)
  if (import.meta.env.MODE === 'production') {
    return '/api';
  }

  // 3. Local development: use localhost backend with /api
  return 'http://localhost:8000/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20000, // 20s timeout – handles Vercel cold-start delays gracefully
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fintrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Global error handler and auto logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear auth
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('fintrack_token');
        localStorage.removeItem('fintrack_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
