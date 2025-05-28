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
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [logoutMsg, setLogoutMsg] = useState('');

  // Check token and fetch user profile on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          const profile = await getProfile();
          setUser(profile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await loginService(email, password);
      const { token: newToken, user: userData } = response;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const googleLogin = useCallback(async (userData, accessToken) => {
    try {
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('token', accessToken);
      
      // Fetch user profile to get complete user data
      const profile = await getProfile();
      if (profile) {
        setUser(profile);
      }
      
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
  }, []);

  const value = {
    user,
    token,
    isLoading,
    login,
    googleLogin,
    logout,
    logoutMsg,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
