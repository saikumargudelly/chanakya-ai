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
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true
  const [logoutMsg, setLogoutMsg] = useState('');
  // Store logout timeout id
  const logoutTimeoutRef = React.useRef();

  const logout = useCallback(() => {
    logoutService();
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
  }, []);

  // Check token and fetch user profile on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        setUser(null);
        setIsLoading(false); // No token, loading is done
        return;
      }

      setToken(storedToken);
      
      try {
        const decoded = decodeJWT(storedToken);
        if (!decoded || !decoded.exp) {
          throw new Error('Invalid token format');
        }
        
        const now = Date.now() / 1000;
        
        // Check if token is expired
        if (decoded.exp < now) {
          throw new Error('Token expired');
        }
        
        // Fetch user profile data using the token
        const userProfile = await getProfile();
        console.log('Fetched user profile:', userProfile);
        const userData = {
          ...userProfile,
          token: storedToken,
          username: userProfile.email.split('@')[0],
          userId: userProfile.id,
          user_id: userProfile.id
        };
        
        setUser(userData);
        console.log('AuthContext: user data set after fetching profile:', userData);
        
        // Set timeout for auto-logout
        if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
        const msUntilExpiry = (decoded.exp - now) * 1000;
         // Add a small buffer to auto-logout before actual expiry
        logoutTimeoutRef.current = setTimeout(() => {
          setLogoutMsg('Session expired. Please log in again.');
          logout();
        }, msUntilExpiry > 5000 ? msUntilExpiry - 5000 : msUntilExpiry);
        
      } catch (error) {
        console.error('Authentication check failed:', error);
        // Clear invalid token if check fails
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expiry');
        setToken(null);
        setUser(null);
        setLogoutMsg(error.message === 'Token expired' 
          ? 'Your session has expired. Please log in again.' 
          : 'Please log in to continue.');
      } finally {
        setIsLoading(false); // Loading is done after check
      }
    };
    
    checkAuth();
    
    // Cleanup on unmount
    return () => {
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    };
  }, [logout]); // Dependency array includes logout

  const login = useCallback(async (email, password) => {
    setIsLoading(true); // Set loading true on login attempt
    try {
       // Clear any existing tokens before new login
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');
      setToken(null);
      setUser(null);
      
      const { token: newToken, user: userData } = await loginService(email, password);
      
      if (!newToken) {
        throw new Error('No token received from login service');
      }
      
      // Store the new token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Set user data (loginService should return basic user info)
      const fullUserData = {
        ...userData,
        token: newToken,
        username: userData.email.split('@')[0],
        userId: userData.id,
        user_id: userData.id
      };
      
      console.log('Login successful - User data:', fullUserData);
      setUser(fullUserData);
      console.log('AuthContext: user data set after login:', fullUserData);
      setLogoutMsg('');
      
      // getProfile is not strictly necessary after login if login returns enough data
      // but can be added here if needed for more detailed profile info
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
       // Clear any invalid tokens on failure
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');
      setToken(null);
      setUser(null);
      setLogoutMsg(error.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false); // Loading is done after login attempt
    }
  }, [logout]); // Dependency array includes logout

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    logoutMsg,
    setToken, // Keep setToken for external use if needed, though internal state should manage it
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
