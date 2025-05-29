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
    
    // Skip retry for certain requests
    if (originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }
    
    const { status, data, config } = error.response;
    
    // Skip retry for login and refresh token endpoints
    const isAuthRequest = config.url.includes('/auth/');
    
    // Handle 401 Unauthorized
    if (status === 401 && !originalRequest._retry && !isAuthRequest) {
      // If we're already refreshing the token, add to queue
      if (isRefreshing) {
        console.log('Token refresh in progress, adding request to queue');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          console.log('Retrying original request with new token');
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return API(originalRequest);
        })
        .catch(err => {
          console.error('Error in queued request after token refresh:', err);
          return Promise.reject(err);
        });
      }

      console.log('Attempting to refresh token...');
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          console.log('Token refresh successful, updating headers');
          localStorage.setItem('token', newToken);
          API.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
          originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
          
          // Process any queued requests
          processQueue(null, newToken);
          
          // Retry the original request
          console.log('Retrying original request with new token');
          return API(originalRequest);
        }
        
        // If we get here, token refresh failed
        throw new Error('Failed to refresh token');
        
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Process any queued requests with error
        processQueue(refreshError, null);
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expiry');
        
        // Only redirect if we're not already on the login page
        if (window.location.pathname !== '/login') {
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?error=session_expired&returnUrl=${returnUrl}`;
        }
        
        return Promise.reject(refreshError);
        
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle 400 Bad Request with validation errors
    if (status === 400) {
      let errorMessage = 'Invalid request';
      
      if (data.detail) {
        errorMessage = Array.isArray(data.detail) 
          ? data.detail.map(err => err.msg || JSON.stringify(err)).join(' ') 
          : data.detail;
      } else if (data.errors) {
        errorMessage = Object.entries(data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
      }
      
      return Promise.reject(new Error(errorMessage));
    }
    
    // Handle 403 Forbidden
    if (status === 403) {
      return Promise.reject(new Error('You do not have permission to perform this action.'));
    }
    
    // Handle 404 Not Found
    if (status === 404) {
      return Promise.reject(new Error('The requested resource was not found.'));
    }
    
    // Handle 429 Too Many Requests
    if (status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      return Promise.reject(new Error(`Too many requests. Please try again in ${retryAfter} seconds.`));
    }
    
    // Handle 500 Internal Server Error
    if (status >= 500) {
      return Promise.reject(new Error('A server error occurred. Please try again later.'));
    }
    
    // Handle other error responses
    let errorMessage = 'An error occurred. Please try again.';
    
    if (data) {
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.detail) {
        errorMessage = data.detail;
      }
    }
    
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
