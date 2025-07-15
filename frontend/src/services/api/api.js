// API service with proper error handling and response formatting
import axios from 'axios';
import { refreshAccessToken } from '../auth/authService';

// Get the API base URL from environment variables or use default
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000') + '/api/v1';

// Create axios instance with base URL and improved configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
  maxRedirects: 2,
  validateStatus: (status) => status < 500
});

// Request queue for token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

// Response formatter
const formatResponse = (response) => ({
  status: response.status,
  data: response.data,
  success: response.status >= 200 && response.status < 300
});

// Error handler utility
const handleError = (error) => {
  const errorResponse = {
    status: error.response?.status || 500,
    success: false,
    data: null,
    error: {
      message: error.message,
      details: error.response?.data || 'An unexpected error occurred'
    }
  };

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', errorResponse);
  }

  return errorResponse;
};

// API methods
const api = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await apiClient.get(url, config);
      return formatResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  // POST request
  post: async (url, data, config = {}) => {
    try {
      const response = await apiClient.post(url, data, config);
      return formatResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  // PUT request
  put: async (url, data, config = {}) => {
    try {
      const response = await apiClient.put(url, data, config);
      return formatResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await apiClient.delete(url, config);
      return formatResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },
};

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  async (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Request: ${config.method?.toUpperCase()} ${config.url}`, config);
    }
    
    // Skip adding auth header for specific public endpoints
    const publicEndpoints = [
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/api/v1/auth/token',
      '/api/v1/auth/refresh',
      '/api/v1/public/'
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url.endsWith(endpoint) || config.url.includes(endpoint + '?')
    );
    
    if (isPublicEndpoint) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] Skipping auth for public endpoint: ${config.url}`);
      }
      return config;
    }
    
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('token_expiry');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] Token check:', { 
        hasToken: !!token, 
        hasExpiry: !!tokenExpiry,
        expiryTime: tokenExpiry ? new Date(Number(tokenExpiry)).toISOString() : 'N/A',
        currentTime: new Date().toISOString()
      });
    }
    
    // If no token or token is expired, try to refresh
    if (!token || !tokenExpiry) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] No token or expiry found, attempting to refresh...');
      }
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[API] Successfully refreshed token during request');
          }
          config.headers.Authorization = `Bearer ${newToken}`;
          return config;
        }
      } catch (refreshError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[API] Failed to refresh token during request:', refreshError);
        }
        // If we get here, token refresh failed
        const error = new Error('No valid authentication token available');
        error.status = 401;
        return Promise.reject(error);
      }
    }
    
    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date().getTime();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    const isExpired = now > (Number(tokenExpiry) - expiryBuffer);
    
    if (isExpired) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] Token is expired or about to expire, attempting refresh...');
      }
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[API] Successfully refreshed expired token');
          }
          config.headers.Authorization = `Bearer ${newToken}`;
        } else {
          throw new Error('Failed to refresh token: No token returned');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[API] Failed to refresh expired token:', error);
        }
        // Continue with the current token as a fallback
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      // Add auth header with current token
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] Using existing valid token');
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the final headers being sent
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] Final request headers:', {
        ...config.headers,
        // Don't log the full token for security
        Authorization: config.headers.Authorization ? 'Bearer [TOKEN]' : 'None'
      });
    }
    
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API] Request interceptor error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh and common errors
// Response interceptor for handling timeouts and errors
apiClient.interceptors.response.use(
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
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[API] Request timed out:', {
          url: originalRequest?.url,
          method: originalRequest?.method,
          timeout: originalRequest?.timeout
        });
      }
      return Promise.reject(new Error('The server is taking too long to respond. Please try again in a moment.'));
    }

    // Handle network errors
    if (!window.navigator.onLine) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[API] Network error - No internet connection');
      }
      return Promise.reject(new Error('No internet connection. Please check your network and try again.'));
    }

    const response = error.response;
    
    // Log the error with relevant details
    if (process.env.NODE_ENV === 'development') {
      console.error('[API] Response error:', {
        message: error.message,
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: response?.status,
        statusText: response?.statusText,
        data: response?.data,
        isRetry: originalRequest?._retry || false
      });
    }

    // If there's no response, it's likely a network error
    if (!response) {
      return Promise.reject(new Error('Network error. Please check your internet connection.'));
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      if (originalRequest._retry || !localStorage.getItem('refresh_token')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[API] Already retried or no refresh token, logging out...');
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (!newToken || typeof newToken !== 'string') throw new Error('No token returned');
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
    }
    
    // Handle 400 Bad Request
    if (response.status === 400) {
      let errorMessage = 'Invalid request';
      const responseData = response.data || {};
      
      if (responseData.detail) {
        errorMessage = Array.isArray(responseData.detail) 
          ? responseData.detail.map(d => d.msg || d).join(', ')
          : responseData.detail;
      } else if (responseData.message) {
        errorMessage = responseData.message;
      } else if (typeof responseData === 'string') {
        errorMessage = responseData;
      }
      return Promise.reject(new Error(errorMessage));
    }
    
    // Handle 403 Forbidden
    if (response.status === 403) {
      return Promise.reject(new Error('You do not have permission to perform this action.'));
    }
    
    // Handle 404 Not Found
    if (response.status === 404) {
      return Promise.reject(new Error('The requested resource was not found.'));
    }
    
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      const retryAfter = response.headers['retry-after'] || 60;
      return Promise.reject(new Error(`Too many requests. Please try again in ${retryAfter} seconds.`));
    }
    
    // Handle 500 Internal Server Error
    if (response.status >= 500) {
      return Promise.reject(new Error('A server error occurred. Please try again later.'));
    }
    
    // Handle other error responses
    let errorMessage = 'An error occurred. Please try again.';
    const responseData = response.data || {};
    
    if (typeof responseData === 'string') {
      errorMessage = responseData;
    } else if (responseData.message) {
      errorMessage = responseData.message;
    } else if (responseData.error) {
      errorMessage = responseData.error;
    } else if (responseData.detail) {
      errorMessage = responseData.detail;
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

// Setup response interceptor for navigation (used in App component)
const setupResponseInterceptor = (navigate) => {
  const interceptor = apiClient.interceptors.response.use(
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
    apiClient.interceptors.response.eject(interceptor);
  };
};

export { api as default, setupResponseInterceptor };
