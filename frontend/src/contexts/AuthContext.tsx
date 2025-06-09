import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Define valid gender types
type Gender = 'male' | 'female' | 'other';

interface User {
  id?: string;
  name: string;
  email: string;
  picture: string;
  gender: Gender;
  first_name: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  handleLogout: () => void;
  login: (email: string, password: string | null) => Promise<boolean>;
  isLoading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const updateUser = (userData: Partial<User>) => {
    console.log('AuthContext.updateUser called with:', {
      userData,
      currentUser: user,
      hasGender: !!userData?.gender,
      genderValue: userData?.gender
    });
    
    setUser(prevUser => {
      if (!prevUser) {
        console.log('No previous user data available');
        return prevUser;
      }
      
      // Ensure gender is always a valid value (male, female, or other)
      const validGender = (gender: any): Gender => {
        const validGenders: Gender[] = ['male', 'female', 'other'];
        const valid = validGenders.includes(gender) ? gender as Gender : 'other';
        console.log('Validating gender:', { input: gender, valid });
        return valid;
      };
      
      const updatedUser = { 
        ...prevUser, 
        ...userData,
        // Always use the provided gender if it exists, otherwise keep the previous one
        gender: userData.gender !== undefined ? validGender(userData.gender) : prevUser.gender
      };
      
      console.log('Updating user data:', { 
        previous: prevUser, 
        updates: userData, 
        result: updatedUser,
        genderUpdated: prevUser.gender !== updatedUser.gender
      });
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('Saved user data to localStorage');
      
      return updatedUser;
    });
  };

  const login = async (email: string, password: string | null) => {
    try {
      // If password is null, it's a Google login
      if (password === null) {
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          throw new Error('Google authentication failed');
        }

        const data = await response.json();
        const userData: User = {
          name: data.name || email.split('@')[0],
          email: data.email,
          picture: data.picture || '',
          gender: data.gender || 'neutral',
          first_name: data.first_name || email.split('@')[0],
        };

        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }

      // Regular email/password login
      const token = localStorage.getItem('token');
      if (token) {
        const userData: User = {
          name: email.split('@')[0],
          email: email,
          picture: '',
          gender: 'other',
          first_name: email.split('@')[0],
        };
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      updateUser,
      handleLogout,
      login,
    }}>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
        {children}
      </GoogleOAuthProvider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};