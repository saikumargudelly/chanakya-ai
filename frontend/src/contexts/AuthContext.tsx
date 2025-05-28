import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  picture: string;
  gender: string;
  first_name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  handleLogout: () => void;
  login: (email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user data and token exist in localStorage on initial load
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token'); // Also check for token
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        // Optionally validate token here if needed
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        handleLogout(); // Clear invalid data
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  // Re-implement a generic login function for email/password
  const login = async (email, password) => {
     // This function is simplified. The actual authentication API call happens in authService.
     // This context function is primarily to update the state *after* authService confirms success.
     // You might fetch user details here based on the token received from authService.
     const token = localStorage.getItem('token'); // Assuming authService.login stores the token
     if (token) {
        // In a real app, you'd decode/verify the token and/or fetch user details from your backend here
        // For this example, we'll just simulate fetching user data based on email
        const dummyUser: User = { 
          name: email.split('@')[0], 
          email: email, 
          picture: '', 
          gender: 'female',
          first_name: email.split('@')[0] // Use email username as first name for now
        }; // Dummy user data with hardcoded gender
        setUser(dummyUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(dummyUser));
        return true;
     } else {
        setIsAuthenticated(false);
        setUser(null);
        return false;
     }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Also remove token on logout
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, handleLogout, login }}>
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