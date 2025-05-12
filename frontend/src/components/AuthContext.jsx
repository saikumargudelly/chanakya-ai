import React, { createContext, useState, useEffect, useContext } from 'react';

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
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [logoutMsg, setLogoutMsg] = useState('');
  // Store logout timeout id
  const logoutTimeoutRef = React.useRef();

  // Check token expiration and set user
  useEffect(() => {
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.exp) {
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          setLogoutMsg('Session expired. Please log in again.');
          logout();
          return;
        }
        setUser({ token, ...decoded });
        // Set timeout for auto-logout
        if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
        const msUntilExpiry = (decoded.exp - now) * 1000;
        logoutTimeoutRef.current = setTimeout(() => {
          setLogoutMsg('Session expired. Please log in again.');
          logout();
        }, msUntilExpiry);
      } else {
        setUser({ token });
      }
    } else {
      setUser(null);
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    }
    // Cleanup on unmount
    return () => {
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    };
  }, [token]);

  const login = (token, userId, username, email) => {
    setToken(token);
    localStorage.setItem('token', token);
    const decoded = decodeJWT(token);
    setUser({ token, userId, username, email, ...decoded });
    setLogoutMsg('');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, logoutMsg }}>
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
