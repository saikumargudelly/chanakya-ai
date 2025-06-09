import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { refreshAccessToken, isAuthenticated as checkAuth } from '../services/auth/authService';

interface User {
  id?: string;
  userId?: string;
  user_id?: string;
  name?: string;
  first_name?: string;
  email: string;
  picture: string;
  [key: string]: any; // Allow additional properties
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  handleLogout: () => void;
  handleLoginSuccess: (credentialResponse: CredentialResponse) => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  isLoading: boolean;
  token: string | null;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Helper function to normalize user data
const normalizeUserData = (userData: any): User | null => {
  if (!userData) return null;
  
  // Create a new object with required User properties
  const normalized: Partial<User> = {
    ...userData,
    id: userData.id || userData.userId || userData.user_id || 'unknown',
    email: userData.email || 'unknown@example.com',
    name: userData.first_name || userData.name || userData.email?.split('@')[0] || 'User',
    first_name: userData.first_name || userData.name || userData.email?.split('@')[0] || 'User',
    picture: userData.picture || userData.profile_picture || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        userData.first_name || userData.name || userData.email?.split('@')[0] || 'U'
      )}&background=random`
  };
  
  // Ensure all required properties are present
  if (!normalized.email) {
    normalized.email = 'unknown@example.com';
  }
  if (!normalized.picture) {
    normalized.picture = 'https://ui-avatars.com/api/?name=U&background=random';
  }
  
  return normalized as User;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Initialize auth state from localStorage and validate token
  const initializeAuth = useCallback(async () => {
    // Skip if we've already checked auth state
    if (authChecked) return;

    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      // If we don't have both user and token, clear auth state
      if (!storedUser || !storedToken) {
        console.log('[AuthContext] No stored user or token, clearing auth state');
        handleLogout();
        return;
      }

      // We have a token, validate it
      try {
        const isValid = await checkAuth();
        
        if (isValid) {
          // Token is valid, set user and auth state
          const userData = JSON.parse(storedUser);
          const normalizedUser = normalizeUserData(userData);
          
          setUser(normalizedUser);
          setToken(storedToken);
          setIsAuthenticated(true);
          
          // Update localStorage with normalized data
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          console.log('[AuthContext] User authenticated successfully');
        } else {
          // Token is invalid, try to refresh it
          console.log('[AuthContext] Token invalid, attempting refresh...');
          const refreshSuccess = await refreshToken();
          if (!refreshSuccess) {
            console.log('[AuthContext] Token refresh failed, logging out');
            handleLogout();
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error during token validation/refresh:', error);
        handleLogout();
      }
    } catch (error) {
      console.error('[AuthContext] Error initializing auth:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
      setAuthChecked(true);
    }
  }, [authChecked]);

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[AuthContext] Attempting to refresh access token...');
      const newToken = await refreshAccessToken();
      
      if (!newToken) {
        console.warn('[AuthContext] No new token received from refresh');
        return false;
      }

      // Get the stored user data
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        console.warn('[AuthContext] No user data found during token refresh');
        return false;
      }

      // Parse and normalize user data
      let userData;
      try {
        userData = JSON.parse(storedUser);
      } catch (e) {
        console.error('[AuthContext] Error parsing stored user data:', e);
        return false;
      }

      const normalizedUser = normalizeUserData(userData);
      
      // Update state
      setUser(normalizedUser);
      setToken(newToken);
      setIsAuthenticated(true);
      
      // Update localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      console.log('[AuthContext] Token refreshed successfully');
      return true;
      
    } catch (error) {
      console.error('[AuthContext] Error refreshing token:', error);
      // Clear invalid tokens on error
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      return false;
    }
  }, []);

  // Initial auth check on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Handle storage events for cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        initializeAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initializeAuth]);

  // Login function for email/password authentication
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const { access_token, refresh_token, user: userData } = await response.json();
      
      if (!access_token) {
        throw new Error('No access token received');
      }

      // Store tokens
      localStorage.setItem('token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      // Store user data
      if (userData) {
        const normalizedUser = normalizeUserData(userData);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
        setToken(access_token);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoginSuccess = useCallback(async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    
    try {
      // Decode the JWT token to get user info
      const decodedToken = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      
      const userData: User = {
        id: decodedToken.sub || decodedToken.userId || decodedToken.id,
        userId: decodedToken.sub || decodedToken.userId || decodedToken.id,
        user_id: decodedToken.sub || decodedToken.userId || decodedToken.id,
        name: decodedToken.given_name || decodedToken.name || decodedToken.email.split('@')[0],
        first_name: decodedToken.given_name || decodedToken.name || decodedToken.email.split('@')[0],
        email: decodedToken.email,
        picture: decodedToken.picture || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            decodedToken.given_name || decodedToken.name || decodedToken.email.split('@')[0]
          )}&background=random`,
      };

      // Store the token and user data
      localStorage.setItem('token', credentialResponse.credential);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setUser(userData);
      setToken(credentialResponse.credential);
      setIsAuthenticated(true);
      
      // Navigate to dashboard
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Error during login:', error);
      handleLogout();
    }
  }, []);

  const handleLogout = useCallback(() => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    
    // Reset state
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // Notify other tabs/windows about logout
    window.dispatchEvent(new Event('authStateChanged'));
    
    // Redirect to login page if not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    handleLogout,
    handleLoginSuccess,
    login,
    isLoading: !authChecked || isLoading,
    token,
    refreshToken
  }), [user, isAuthenticated, handleLogout, handleLoginSuccess, login, authChecked, isLoading, token, refreshToken]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const GoogleLoginButton = () => {
  const { handleLoginSuccess } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <GoogleLogin
        onSuccess={handleLoginSuccess}
        onError={() => console.log('Login Failed')}
        useOneTap
        theme="filled_blue"
        shape="rectangular"
        text="signin_with"
        size="large"
      />
    </div>
  );
}; 