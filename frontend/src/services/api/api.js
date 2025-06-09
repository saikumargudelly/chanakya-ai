import axios from 'axios';
import { refreshAccessToken } from '../auth/authService';

// Get the API base URL from environment variables or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
console.log('API Base URL:', API_BASE_URL);

// Create axios instance with base URL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // Important for sending cookies with CORS
});

// Flag to prevent multiple token refresh attempts
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
  async (config) => {
    console.log(`[API] Request: ${config.method?.toUpperCase()} ${config.url}`, config);
    
    // Skip adding auth header for auth endpoints and public routes
    if (config.url.includes('/auth/') || config.url.includes('/public/')) {
      console.log('[API] Skipping auth for public endpoint');
      return config;
    }
    
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('token_expiry');
    
    console.log('[API] Token check:', { 
      hasToken: !!token, 
      hasExpiry: !!tokenExpiry,
      expiryTime: tokenExpiry ? new Date(Number(tokenExpiry)).toISOString() : 'N/A',
      currentTime: new Date().toISOString()
    });
    
    // If no token or token is expired, try to refresh
    if (!token || !tokenExpiry) {
      console.log('[API] No token or expiry found, attempting to refresh...');
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          console.log('[API] Successfully refreshed token during request');
          config.headers.Authorization = `Bearer ${newToken}`;
          return config;
        }
      } catch (error) {
        console.error('[API] Failed to refresh token during request:', error);
      }
      
      // If we get here, token refresh failed
      const error = new Error('No valid authentication token available');
      error.status = 401;
      return Promise.reject(error);
    }
    
    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date().getTime();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    const isExpired = now > (Number(tokenExpiry) - expiryBuffer);
    
    if (isExpired) {
      console.log('[API] Token is expired or about to expire, attempting refresh...');
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          console.log('[API] Successfully refreshed expired token');
          config.headers.Authorization = `Bearer ${newToken}`;
        } else {
          throw new Error('Failed to refresh token: No token returned');
        }
      } catch (error) {
        console.error('[API] Failed to refresh expired token:', error);
        // Continue with the current token as a fallback
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      // Add auth header with current token
      console.log('[API] Using existing valid token');
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the final headers being sent
    console.log('[API] Final request headers:', {
      ...config.headers,
      // Don't log the full token for security
      Authorization: config.headers.Authorization ? 'Bearer [TOKEN]' : 'None'
    });
    
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh and common errors
API.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Response ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        data: response.data,
        headers: response.headers,
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const response = error.response;
    
    // Log the error with relevant details
    console.error('[API] Response error:', {
      message: error.message,
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: response?.status,
      statusText: response?.statusText,
      data: response?.data,
      isRetry: originalRequest?._retry || false
    });

    // If there's no response, it's likely a network error
    if (!response) {
      return Promise.reject(new Error('Network error. Please check your internet connection.'));
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      // If this is already a retry or we don't have a refresh token, log out
      if (originalRequest._retry || !localStorage.getItem('refresh_token')) {
        console.log('[API] Already retried or no refresh token, logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
      
      // If we're already refreshing the token, add to queue
      if (isRefreshing) {
        console.log('Token refresh in progress, adding request to queue');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          console.log('Retrying original request with new token');
          originalRequest.headers.Authorization = `Bearer ${token}`;
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
          
          // Update the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Process any queued requests
          processQueue(null, newToken);
          
          // Retry the original request with new token
          return API(originalRequest);
        } else {
          // If no new token, clear everything and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expiry');
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
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
