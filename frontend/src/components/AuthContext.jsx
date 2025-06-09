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

  // Update user function with validation
  const updateUser = useCallback((userData) => {
    if (!userData) return;

    setUser(prevUser => {
      // Ensure gender is always valid
      const validGender = ['male', 'female', 'neutral'].includes(userData.gender) 
        ? userData.gender 
        : prevUser?.gender || 'neutral';

      const updatedUser = {
        ...prevUser,
        ...userData,
        gender: validGender
      };

      console.log('Updating user state with:', updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  // Check token and fetch user profile on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken) {
          setToken(storedToken);
          // First set stored user if available
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          }
          // Then fetch fresh profile
          const profile = await getProfile();
          if (profile) {
            console.log('Setting initial user profile:', profile);
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password, userData = null) => {
    try {
      // If we have userData (from Google OAuth), use it directly
      if (userData) {
        console.log('Processing OAuth with provided user data', userData);
        setToken(email); // email is actually the token in this case
        localStorage.setItem('token', email);
        
        // Ensure gender is valid
        const validGender = ['male', 'female', 'neutral'].includes(userData.gender) 
          ? userData.gender 
          : 'neutral';
          
        const userWithValidGender = {
          ...userData,
          gender: validGender,
          is_authenticated: true
        };
        
        setUser(userWithValidGender);
        localStorage.setItem('user', JSON.stringify(userWithValidGender));
        return true;
      }
      // If password is null and email is actually a token (Google OAuth case)
      else if (password === null && email && (email.includes('.') || email.startsWith('ey'))) {
        console.log('Processing OAuth token login');
        
        // This is a JWT token from OAuth
        setToken(email);
        localStorage.setItem('token', email);
        
        try {
          // Try to get user profile with the token
          const profile = await getProfile();
          if (profile) {
            console.log('Successfully retrieved user profile', profile);
            // Ensure gender is valid
            const validGender = ['male', 'female', 'neutral'].includes(profile.gender) 
              ? profile.gender 
              : 'neutral';
              
            const userWithValidGender = {
              ...profile,
              gender: validGender,
              is_authenticated: true
            };
            
            setUser(userWithValidGender);
            localStorage.setItem('user', JSON.stringify(userWithValidGender));
            return true;
          }
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          // If profile fetch fails, try to decode the token for basic user info
          try {
            const payload = JSON.parse(atob(email.split('.')[1]));
            const tempUser = {
              email: payload.email || 'user@example.com',
              first_name: payload.given_name || payload.name?.split(' ')[0] || 'User',
              last_name: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
              gender: 'neutral', // Default to neutral if not provided
              is_authenticated: true
            };
            setUser(tempUser);
            localStorage.setItem('user', JSON.stringify(tempUser));
            return true;
          } catch (decodeError) {
            console.error('Error decoding token:', decodeError);
            throw new Error('Failed to process authentication token');
          }
        }
        return false;
      }
      
      // Regular email/password login
      console.log('Processing email/password login');
      const response = await loginService(email, password);
      if (!response || !response.token) {
        throw new Error('Invalid login response');
      }
      
      console.log('Login successful, setting token and user');
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  // This function is kept for backward compatibility but not used directly
  const googleLogin = useCallback(async (userData, accessToken) => {
    try {
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Fetch user profile to get complete user data
      const profile = await getProfile();
      if (profile) {
        setUser(profile);
        localStorage.setItem('user', JSON.stringify(profile));
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
    localStorage.removeItem('user');
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
    updateUser
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
