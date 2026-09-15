import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  // 1. If VITE_API_URL is configured for an external production backend (e.g. Render backend)
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 2. In production mode (e.g. Vercel deployment), if no external API URL is given,
  // use relative URL ("") so backend API requests route to the same domain per vercel.json
  if (import.meta.env.MODE === 'production') {
    return envUrl || '';
  }

  // 3. Local development fallback (including local IP testing like 192.168.x.x)
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const host = window.location.hostname;
    return `http://${host}:8000`;
  }
  return 'http://localhost:8000';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
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
