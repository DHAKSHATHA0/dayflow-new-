import axios from 'axios';

// When running with Vite proxy or hosted, use relative /api by default unless VITE_API_URL is specified
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.origin.includes(':5173')
    ? '/api'
    : 'http://localhost:5000/api');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 3500,
});

// Request interceptor to attach JWT Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dayflow_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s and format errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token expired and not on auth pages, remove token
      if (
        !window.location.pathname.startsWith('/signin') &&
        !window.location.pathname.startsWith('/signup') &&
        window.location.pathname !== '/'
      ) {
        localStorage.removeItem('dayflow_token');
        localStorage.removeItem('dayflow_user');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
