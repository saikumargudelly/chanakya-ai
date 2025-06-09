import api from './api';

// Store the current refresh token request to prevent multiple calls
let refreshTokenPromise = null;

/**
 * Logs in a user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} User data and token
 */
export const login = async (email, password) => {
  try {
    console.log('Attempting login with:', { email });
    
    // Use URLSearchParams for form-urlencoded content type
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    params.append('grant_type', 'password');
    
    const response = await api.post('/auth/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      skipAuthRefresh: true, // Don't try to refresh token for login request
      withCredentials: true
    });

    console.log('Login response:', response.data);

    if (response.data && response.data.access_token) {
      const { access_token, refresh_token, expires_in } = response.data;
      
      // Store the tokens in localStorage
      localStorage.setItem('token', access_token);
      
      // Store refresh token if available
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      
      // Store token expiration time (default to 1 hour if not provided)
      const expiresIn = expires_in || 3600;
      const tokenExpiry = new Date().getTime() + (expiresIn * 1000);
      localStorage.setItem('token_expiry', tokenExpiry.toString());
      
      // Get user profile
      const profileResponse = await api.get('/auth/profile', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      
      return {
        token: access_token,
        user: profileResponse.data
      };
    }
    
    throw new Error('No access token received');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Registers a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration response
 */
export const register = async (userData) => {
  try {
    console.log('Attempting registration with:', {
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name
    });
    
    // Prepare registration data according to backend schema
    const registrationData = {
      email: userData.email,
      password: userData.password,
      first_name: userData.first_name,
      last_name: userData.last_name,
      gender: userData.gender || 'neutral',
      mobile_number: userData.mobile_number || ''
    };
    
    console.log('Sending registration data:', registrationData);
    
    const response = await api.post('/auth/register', registrationData, {
      skipAuthRefresh: true // Don't try to refresh token for registration
    });
    
    console.log('Registration response:', response.data);
    
    if (response.data && response.data.access_token) {
      const { access_token, refresh_token, expires_in } = response.data;
      
      // Store the tokens in localStorage
      localStorage.setItem('token', access_token);
      
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      
      // Store token expiration time
      const expiresIn = expires_in || 3600;
      const tokenExpiry = new Date().getTime() + (expiresIn * 1000);
      localStorage.setItem('token_expiry', tokenExpiry.toString());
      
      return {
        success: true,
        token: access_token
      };
    }
    
    return { success: true, message: 'Registration successful.' };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Refreshes the access token using the refresh token
 * @returns {Promise<string>} New access token
 */
export const refreshAccessToken = async () => {
  // If a refresh is already in progress, return the existing promise
  if (refreshTokenPromise) {
    console.log('Token refresh already in progress, waiting...');
    return refreshTokenPromise;
  }
  
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.warn('No refresh token available');
      throw new Error('No refresh token available. Please log in again.');
    }
    
    console.log('Attempting to refresh access token...');
    
    // Create the refresh token request
    refreshTokenPromise = api.post(
      '/auth/refresh-token',
      {
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      },
      {
        skipAuthRefresh: true, // Don't try to refresh token for refresh request
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    .then(response => {
      console.log('Token refresh successful');
      
      if (!response.data || !response.data.access_token) {
        throw new Error('No access token in refresh response');
      }
      
      const { access_token, refresh_token, expires_in } = response.data;
      
      // Store the new token
      localStorage.setItem('token', access_token);
      
      // Update refresh token if a new one is provided
      if (refresh_token) {
        console.log('New refresh token received');
        localStorage.setItem('refresh_token', refresh_token);
      }
      
      // Update token expiration (default to 1 hour if not provided)
      const expiresIn = expires_in || 3600;
      const tokenExpiry = new Date().getTime() + (expiresIn * 1000);
      localStorage.setItem('token_expiry', tokenExpiry.toString());
      
      console.log('Token refresh completed successfully');
      return access_token;
    })
    .catch(error => {
      console.error('Error during token refresh:', error);
      // Clear all auth data on any error during refresh
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');
      
      // If we're not already on the login page, redirect there
      if (window.location.pathname !== '/login') {
        window.location.href = `/login?error=session_expired&from=${encodeURIComponent(window.location.pathname)}`;
      }
      
      throw new Error('Your session has expired. Please log in again.');
    })
    .finally(() => {
      // Always reset the promise when done
      refreshTokenPromise = null;
    });
    
    return await refreshTokenPromise;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    
    // Rethrow the error for the interceptor to handle
    throw error;
  }
};

/**
 * Gets the current user's profile
 * @returns {Promise<Object>} User profile data
 */
export const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * Checks if the user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  // Check token expiration
  const expiry = localStorage.getItem('token_expiry');
  if (expiry && new Date().getTime() > parseInt(expiry, 10)) {
    return false;
  }
  
  return true;
};

/**
 * Logs out the current user
 */
export const logout = () => {
  // Clear all auth data
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expiry');
  
  // Clear any pending requests
  if (refreshTokenPromise) {
    refreshTokenPromise = null;
  }
  
  // Redirect to login page
  window.location.href = '/login';
};
