import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api/api';
import { useAuth } from '../context/AuthContext';

const GoalContext = createContext();

export const GoalProvider = ({ children }) => {
  const { user, token, logout } = useAuth();
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch goals only when user and token are available
  const fetchGoals = async () => {
    if (!user || !token) return;
    setIsLoading(true);
    try {
      // Pass token explicitly in case api instance doesn't pick it up
      const res = await api.get('/goals/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setGoals(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (e) {
      if (e.response?.status === 401) logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchGoals();
    }
    // Only run when user or token changes
  }, [user, token]);

  return (
    <GoalContext.Provider value={{ goals, isLoading, fetchGoals }}>
      {children}
    </GoalContext.Provider>
  );
};

export const useGoals = () => useContext(GoalContext);
