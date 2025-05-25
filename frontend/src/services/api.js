import axios from 'axios';
import { refreshAccessToken } from './authService';

// Get the API base URL from environment variables or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
console.log('API Base URL:', API_BASE_URL);

// Create axios instance with default config
const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending cookies with CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 30000, // 30 seconds timeout
});


let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add request interceptor to include auth token
API.interceptors.request.use(
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

// Add response interceptor to handle token refresh and common errors
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }
    
    const { status, data } = error.response;
    
    // Handle 401 Unauthorized
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If token refresh is in progress, add to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return API(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          localStorage.setItem('token', newToken);
          API.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
          originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
          processQueue(null, newToken);
          return API(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle 400 Bad Request with validation errors
    if (status === 400 && data.detail) {
      return Promise.reject(new Error(Array.isArray(data.detail) 
        ? data.detail.map(err => err.msg).join(' ') 
        : data.detail));
    }
    
    // Handle 404 Not Found
    if (status === 404) {
      return Promise.reject(new Error('The requested resource was not found.'));
    }
    
    // Handle 500 Internal Server Error
    if (status >= 500) {
      return Promise.reject(new Error('A server error occurred. Please try again later.'));
    }
    
    // Handle other error responses
    const errorMessage = data?.message || data?.error || 'An error occurred. Please try again.';
    return Promise.reject(new Error(errorMessage));
  }
);

// Setup response interceptor for navigation (used in App component)
export const setupResponseInterceptor = (navigate) => {
  const interceptor = API.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Only redirect if not already on the login page
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          navigate('/login', { 
            state: { 
              from: window.location.pathname,
              error: 'Your session has expired. Please log in again.'
            } 
          });
        }
      }
      return Promise.reject(error);
    }
  );
  
  // Return cleanup function
  return () => {
    API.interceptors.response.eject(interceptor);
  };
};

export default API;
