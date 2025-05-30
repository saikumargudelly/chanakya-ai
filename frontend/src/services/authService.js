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
      const { access_token, refresh_token, expires_in, user_id, ...userData } = response.data;
      
      // Store the token in localStorage
      localStorage.setItem('token', access_token);
      
      // Store refresh token if available
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      
      // Store token expiration time (default to 1 hour if not provided)
      const expiresIn = expires_in || 3600;
      const tokenExpiry = new Date().getTime() + (expiresIn * 1000);
      localStorage.setItem('token_expiry', tokenExpiry.toString());
      
      console.log('User data from login:', userData);
      
      return {
        token: access_token,
        user: {
          id: user_id || userData.id,
          email: email,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          gender: userData.gender || 'neutral',
          is_active: userData.is_active !== undefined ? userData.is_active : true
        }
      };
    }
    
    throw new Error('No access token received');
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response.data) {
        errorMessage = error.response.data.detail || 
                     error.response.data.error_description ||
                     error.response.data.error || 
                     errorMessage;
      }
    } else if (error.request) {
      errorMessage = 'No response from server. Please check your connection.';
    }
    
    throw new Error(errorMessage);
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
    
    // Auto-login after successful registration
    if (response.data && response.data.email) {
      console.log('Auto-login after registration');
      return await login(userData.email, userData.password);
    }
    
    // If we get here, registration was successful but auto-login didn't happen
    return { success: true, message: 'Registration successful. Please log in.' };
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.response) {
      if (error.response.status === 400) {
        errorMessage = error.response.data.detail || 'Invalid registration data';
      } else if (error.response.data) {
        errorMessage = error.response.data.detail || 
                     error.response.data.error_description ||
                     error.response.data.error || 
                     errorMessage;
      }
    } else if (error.request) {
      errorMessage = 'No response from server. Please check your connection.';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Refreshes the access token using the refresh token
 * @returns {Promise<string>} New access token
 */
export const refreshAccessToken = async () => {
  // If a refresh is already in progress, return the existing promise
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }
  
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    // Create the refresh token request
    refreshTokenPromise = api.post('/auth/refresh-token', {
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }, {
      skipAuthRefresh: true // Don't try to refresh token for refresh request
    }).then(response => {
      if (response.data.access_token) {
        // Store the new token
        localStorage.setItem('token', response.data.access_token);
        
        // Update refresh token if a new one is provided
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        
        // Update token expiration
        const expiresIn = response.data.expires_in || 3600;
        const tokenExpiry = new Date().getTime() + (expiresIn * 1000);
        localStorage.setItem('token_expiry', tokenExpiry.toString());
        
        return response.data.access_token;
      }
      throw new Error('No access token in refresh response');
    }).finally(() => {
      // Reset the promise when done
      refreshTokenPromise = null;
    });
    
    return await refreshTokenPromise;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear tokens if refresh fails
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
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
