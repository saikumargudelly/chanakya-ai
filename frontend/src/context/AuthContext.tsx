import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CredentialResponse } from '@react-oauth/google';
import { refreshAccessToken, checkAuth } from '../services/auth/authService';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../api/config';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@chakra-ui/react';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import api from '../services/api/api';

// Set up logging
const logger = {
  info: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, meta || '');
    }
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  },
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error || '');
    }
  },
  warn: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, meta || '');
    }
  }
};

// Define interfaces at the top to avoid circular dependencies
// API Response Types
interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string | number;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  is_new_user: boolean;
  expires_in?: number;
  refresh_token?: string;
  user?: any;
}

interface User {
  id: string;
  userId?: string;
  user_id?: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  picture: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  mobile_number?: string;
  phone_number?: string;
  full_name?: string;
  is_new_user?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  // Allow additional properties
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  handleLogout: () => void;
  handleLoginSuccess: (credentialResponse: CredentialResponse) => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  isLoading: boolean;
  token: string | null;
  refreshToken: () => Promise<boolean>;
  getToken: () => string | null;
  getUser: () => User | null;
  clearAuthStorage: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Token management
let isRefreshing = false;
type TokenRefreshCallback = (token: string | boolean) => void;
let refreshSubscribers: TokenRefreshCallback[] = [];
let lastAuthCheck = 0;
const AUTH_CHECK_DEBOUNCE = 2000; // 2 seconds minimum between auth checks

const onTokenRefreshed = (token: string | boolean) => {
  const subscribers = [...refreshSubscribers];
  refreshSubscribers = [];
  subscribers.forEach(cb => cb(token));
};

// Helper function to normalize user data
const normalizeUserData = (userData: any): User | null => {
  if (!userData) return null;
  
  // Create a new object with required User properties
  // Normalize gender to one of the allowed values
  const gender = userData.gender?.toLowerCase();
  const normalizedGender = gender === 'male' || gender === 'female' ? gender : 'other';
  
  // Always ensure id is present and string
  const id = (userData.id || userData.userId || userData.user_id || userData._id || userData.pk || 'unknown').toString();
  
  const normalized: Partial<User> = {
    ...userData,
    id,
    email: userData.email || 'unknown@example.com',
    name: userData.first_name || userData.name || userData.email?.split('@')[0] || 'User',
    first_name: userData.first_name || userData.name || userData.email?.split('@')[0] || 'User',
    gender: normalizedGender,
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
  if (!normalized.id) {
    normalized.id = 'unknown';
  }

  // Debug logs
  console.log('normalizeUserData input:', userData);
  console.log('normalizeUserData output:', normalized);
  if (!normalized.id || normalized.id === 'unknown') {
    console.error('[normalizeUserData] User object missing valid id:', userData);
  }
  
  return normalized as User;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSessionExpiring, setIsSessionExpiring] = useState(false);
  const sessionExpiryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check token expiry
  const checkTokenExpiry = useCallback(() => {
    const expiry = localStorage.getItem('token_expiry');
    if (!expiry) return false;
    return Date.now() < parseInt(expiry, 10);
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expiry');
    
    // Clear any active timeouts
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
    
    // Reset state
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // Redirect to login
    navigate('/login');
  }, [navigate, sessionTimeout]);

  // Modified session timeout logic to show modal 1 minute before expiry
  const setupSessionTimeout = useCallback(() => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    if (sessionExpiryTimeoutRef.current) {
      clearTimeout(sessionExpiryTimeoutRef.current);
    }
    const expiry = localStorage.getItem('token_expiry');
    if (!expiry) return;
    const timeUntilExpiry = parseInt(expiry, 10) - Date.now();
    if (timeUntilExpiry <= 0) {
      handleLogout();
      return;
    }
    // Show modal 1 minute before expiry
    const warningTime = Math.max(timeUntilExpiry - 60000, 0);
    sessionExpiryTimeoutRef.current = setTimeout(() => {
      setIsSessionExpiring(true);
    }, warningTime);
    // Set timeout to log out at expiry
    const timeout = setTimeout(() => {
      handleLogout();
    }, timeUntilExpiry);
    setSessionTimeout(timeout);
  }, [handleLogout, sessionTimeout]);

  // Handler for refreshing session from modal
  const handleRefreshSession = async () => {
    setIsSessionExpiring(false);
    await refreshToken();
    setupSessionTimeout();
  };

  // Handler for logging out from modal
  const handleSessionLogout = () => {
    setIsSessionExpiring(false);
    handleLogout();
  };

  // Refresh the access token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    if (isRefreshing) {
      return new Promise<boolean>((resolve) => {
        const callback: TokenRefreshCallback = (token) => {
          resolve(typeof token === 'string' ? true : !!token);
        };
        refreshSubscribers.push(callback);
        setTimeout(() => {
          const index = refreshSubscribers.indexOf(callback);
          if (index > -1) refreshSubscribers.splice(index, 1);
          resolve(false);
        }, 30000);
      });
    }
    isRefreshing = true;
    try {
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      const data: AuthResponse = response.data;
      if (!data.access_token) throw new Error('No access token in response');
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
      onTokenRefreshed(data.access_token);
      return true;
    } catch (error) {
      onTokenRefreshed(false);
      handleLogout();
      return false;
    } finally {
      isRefreshing = false;
    }
  }, [handleLogout]);

  // Google OAuth logic using the custom hook
  const { handleGoogleAuth, isLoading: isGoogleLoading, error: googleError } = useGoogleAuth({
    onSuccess: (data) => {
      console.log('[DEBUG] Google login onSuccess handler called', data);
      // Normalize and store user data
      let userData = data.user || {};
      if (userData.id) userData.id = userData.id.toString();
      if (userData.user_id) userData.user_id = userData.user_id.toString();
      const normalizedUser = normalizeUserData(userData);
      if (normalizedUser) {
        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      }
      setToken(data.access_token);
      setIsAuthenticated(true);
      setupSessionTimeout();
      const redirectPath = data.is_new_user ? '/onboarding' : '/dashboard';
      navigate(redirectPath);
    },
    onError: (error) => {
      toast({
        title: 'Authentication Error',
        description: error.message || 'Failed to sign in with Google',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Expose the Google OAuth handler for use in Login/Signup
  const loginWithGoogle = handleGoogleAuth;

  // Handle email/password login
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', {
        username: credentials.email,
        password: credentials.password
      });
      const data = response.data;
      if (!data.access_token) return false;
      let normalizedUser: User | null = null;
      if (data.user) {
        normalizedUser = normalizeUserData(data.user);
      } else {
        const meResponse = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${data.access_token}` }
        });
        normalizedUser = normalizeUserData(meResponse.data);
      }
      if (!normalizedUser || !normalizedUser.id || normalizedUser.id === 'unknown') return false;
      setUser(normalizedUser);
      setToken(data.access_token);
      setIsAuthenticated(true);
      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setupSessionTimeout();
      navigate('/dashboard');
      return true;
    } catch (error) {
      return false;
    }
  }, [navigate, setupSessionTimeout]);

  // Add debounced auth check
  const debouncedCheckAuth = useCallback(async () => {
    console.log('[DEBUG] debouncedCheckAuth called');
    const now = Date.now();
    if (now - lastAuthCheck < AUTH_CHECK_DEBOUNCE) {
      console.log('[DEBUG] Skipping auth check due to debounce');
      return isAuthenticated;
    }
    
    lastAuthCheck = now;
    try {
      const isValid = await checkAuth();
      if (!isValid && token) {
        // Only attempt refresh if we have a token but it's invalid
        console.log('[DEBUG] debouncedCheckAuth: token invalid, calling refreshToken');
        return await refreshToken();
      }
      return isValid;
    } catch (error) {
      console.error('[AuthContext] Auth check failed:', error);
      return false;
    }
  }, [isAuthenticated, token, refreshToken]);

  // Initialize auth state
  useEffect(() => {
    console.log('[DEBUG] AuthContext useEffect (auth initialization) running');
    let isMounted = true;
    
    const initializeAuth = async () => {
      const currentCheckTokenExpiry = checkTokenExpiry;
      const currentDebouncedCheck = debouncedCheckAuth;
      const currentSetupTimeout = setupSessionTimeout;
      const currentHandleLogout = handleLogout;

      console.log('[DEBUG] Initializing auth state...');
      if (isMounted) {
        setIsLoading(true);
      }
      
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        const normalizedUser = normalizeUserData(userData);
        if (normalizedUser) {
          setUser(normalizedUser);
          setToken(storedToken);
          setIsAuthenticated(true);
          currentSetupTimeout();
        }
      }

      if (!storedToken || !storedUser) {
        console.log('[DEBUG] No stored user or token, clearing auth state');
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        console.log('[DEBUG] Calling debouncedCheckAuth from initializeAuth');
        const isValid = await currentDebouncedCheck();
        if (isValid && currentCheckTokenExpiry()) {
          // Already set above
        } else if (!isValid) {
          if (isMounted) {
            currentHandleLogout();
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        if (isMounted) {
          currentHandleLogout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      isMounted = false;
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    };
  }, []);

  // Handle storage events for cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!storedToken || !storedUser) {
          handleLogout();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleLogout]);

  const contextValue = useMemo(() => ({
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    isLoading,
    token,
    handleLogout,
    login,
    handleLoginSuccess: loginWithGoogle,
    refreshToken,
    checkAuth: debouncedCheckAuth,
    getToken: () => localStorage.getItem('token'),
    getUser: () => {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    },
    clearAuthStorage: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('token_expiry');
    },
  }), [user, isAuthenticated, isLoading, token, handleLogout, login, loginWithGoogle, refreshToken, debouncedCheckAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <Modal isOpen={isSessionExpiring} onClose={handleSessionLogout} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Session Expiring Soon</ModalHeader>
          <ModalBody>
            Your session will expire in less than a minute. Would you like to refresh your session or log out?
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleRefreshSession}>
              Refresh Session
            </Button>
            <Button variant="ghost" onClick={handleSessionLogout}>Log Out</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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

// Google OAuth Login Button Component
export const GoogleLoginButton = () => {
  const { handleLoginSuccess } = useAuth();
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <GoogleSignInButton 
        onSuccess={handleLoginSuccess}
        buttonText="Sign in with Google"
        isFullWidth={false}
      />
    </div>
  );
};