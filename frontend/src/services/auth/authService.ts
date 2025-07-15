import api from '../api/api';

// Token refresh queue management
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

interface RegisterResponse {
  user: any;
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

interface GoogleAuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  name?: string;
  picture?: string;
  is_new_user: boolean;
  expires_in?: number;
}

/**
 * Register a new user
 */
export const register = async (userData: {
  email: string;
  password?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  mobile_number?: string;
  google_id?: string;
  picture?: string;
}): Promise<{ user: any; token: string }> => {
  try {
    console.log('[Auth] Registering user:', userData.email);
    // Only handle email/password registration here
    if (!userData.google_id) {
      const response = await api.post('/auth/register', {
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        mobile_number: userData.mobile_number
      });
      if ((response.status === 200 || response.status === 201) && response.data) {
        console.log('[Auth] Registration successful');
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        return {
          user: response.data.user,
          token: response.data.access_token
        };
      }
      throw new Error('Registration failed');
    } else {
      throw new Error('Google registration is handled via /auth/google endpoint.');
    }
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    throw error;
  }
};

/**
 * Check if the current auth token is valid
 */
export const checkAuth = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[Auth] No token found');
      return false;
    }
    
    const response = await api.get('/auth/me', {
      validateStatus: (status) => status < 500, // Don't throw on 401/403
    });

    return response.status === 200;
  } catch (error) {
    console.error('[Auth] Error checking auth status:', error);
    return false;
  }
};

/**
 * Refresh the access token using the refresh token
 */
export const refreshAccessToken = async (): Promise<string | boolean> => {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push((newToken) => {
        resolve(newToken);
      });
    });
  }

  isRefreshing = true;
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    console.log('[Auth] No refresh token available');
    isRefreshing = false;
    return false;
  }

  try {
    const response = await api.post('/auth/refresh', { 
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    if (response.data.access_token) {
      const { access_token, refresh_token, expires_in } = response.data;
      
      // Update tokens in localStorage
      localStorage.setItem('token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      // Update token expiry if provided
      if (expires_in) {
        const expiryTime = Date.now() + (expires_in * 1000);
        localStorage.setItem('token_expiry', expiryTime.toString());
      }

      // Notify all waiting requests
      onTokenRefreshed(access_token);
      return access_token;
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear auth data on refresh failure
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    throw error;
  } finally {
    isRefreshing = false;
  }
};

/**
 * Log out the user by clearing auth data
 */
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('token_expiry');
  window.location.href = '/login';
};

const authService = {
  register,
  checkAuth,
  refreshAccessToken,
  logout
};

export default authService;
