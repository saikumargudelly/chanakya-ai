import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { login as loginService, logout as logoutService, getProfile } from '../services/authService';

const AuthContext = createContext();

// Helper to decode JWT (without verifying signature)
function decodeJWT(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    // Get token from localStorage on initial load
    const storedToken = localStorage.getItem('token');
    return storedToken || null;
  });

  // On mount, always clear user data if no valid token exists
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      localStorage.removeItem('user'); // In case you store user separately
      setUser(null);
    }
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  const [logoutMsg, setLogoutMsg] = useState('');
  // Store logout timeout id
  const logoutTimeoutRef = React.useRef();

  const logout = useCallback(() => {
    logoutService();
    setToken(null);
    setUser(null);
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
  }, []);

  // Check token and fetch user profile on mount and when token changes
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const currentToken = localStorage.getItem('token');
      
      // If we have a token in state but not in localStorage, sync them
      if (token && !currentToken) {
        localStorage.setItem('token', token);
      }
      // If we have a token in localStorage but not in state, update state
      else if (!token && currentToken) {
        setToken(currentToken);
        setIsLoading(false);
        return;
      }
      // If no token, set loading to false and return
      else if (!token) {
        setUser(null);
        localStorage.removeItem('token'); // Always clear any stray tokens
        localStorage.removeItem('user'); // Always clear any stray user data
        setIsLoading(false);
        return;
      }
      
      try {
        const decoded = decodeJWT(token);
        if (!decoded || !decoded.exp) {
          throw new Error('Invalid token format');
        }
        
        const now = Date.now() / 1000;
        
        // Check if token is expired
        if (decoded.exp < now) {
          throw new Error('Token expired');
        }
        
        // Fetch user profile data
        const userProfile = await getProfile();
        console.log('Fetched user profile:', userProfile);
        const userData = {
          ...userProfile,
          token,
          username: userProfile.email.split('@')[0],
          userId: userProfile.id,
          user_id: userProfile.id
        };
        
        setUser(userData);
        console.log('AuthContext: user data set after fetching profile:', userData);
        
        // Set timeout for auto-logout
        if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
        const msUntilExpiry = (decoded.exp - now) * 1000;
        logoutTimeoutRef.current = setTimeout(() => {
          setLogoutMsg('Session expired. Please log in again.');
          logout();
        }, msUntilExpiry);
        
      } catch (error) {
        console.error('Authentication check failed:', error);
        // Clear invalid token
        if (token) {
          localStorage.removeItem('token');
          setToken(null);
        }
        setUser(null);
        
        // Only show error message if we had a token
        if (token) {
          setLogoutMsg(error.message === 'Token expired' 
            ? 'Your session has expired. Please log in again.' 
            : 'Please log in to continue.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Cleanup on unmount
    return () => {
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    };
  }, [token, logout]);

  const login = useCallback(async (email, password) => {
    try {
      // If we already have a token, just validate it
      const existingToken = localStorage.getItem('token');
      if (existingToken) {
        try {
          const decoded = decodeJWT(existingToken);
          if (decoded && decoded.exp && (decoded.exp > Date.now() / 1000)) {
            // Token is valid, get user data
            const userProfile = await getProfile();
            const userData = {
              ...userProfile,
              token: existingToken,
              username: userProfile.email.split('@')[0],
              userId: userProfile.id,
              user_id: userProfile.id
            };
            setUser(userData);
            return true;
          }
        } catch (e) {
          console.warn('Existing token validation failed:', e);
          // Continue with normal login if token validation fails
        }
      }

      // If no valid token, perform login
      const { token, user } = await loginService(email, password);
      
      if (!token) {
        throw new Error('No token received from login service');
      }
      
      // Store the token
      localStorage.setItem('token', token);
      setToken(token);
      
      // Set user data
      const userData = {
        ...user,
        token,
        username: user.email.split('@')[0],
        userId: user.id,
        user_id: user.id
      };
      
      console.log('Login successful - User data:', userData);
      setUser(userData);
      console.log('AuthContext: user data set after login:', userData);
      setLogoutMsg('');
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      // Clear any invalid tokens
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setLogoutMsg(error.message || 'Login failed. Please try again.');
      return false;
    }
  }, []);

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    logoutMsg,
    setToken,
    updateUser: (newUserData) => {
      setUser(prevUser => ({
        ...prevUser,
        ...newUserData
      }));
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {logoutMsg && (
        <div style={{position:'fixed',top:20,right:20,background:'#f87171',color:'#fff',padding:'1em',borderRadius:'8px',zIndex:1000}}>
          {logoutMsg}
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
