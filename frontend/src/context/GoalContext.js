import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { goalService } from '../services/goalService';
import { useAuth } from '../components/AuthContext.jsx';

const GoalContext = createContext();

export function useGoals() {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
}

export function GoalProvider({ children }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadGoals = useCallback(async () => {
    if (isAuthLoading) return;
    
    // Extract user ID from different possible locations in the user object
    const userId = user?.id || user?.user_id || (user?.data?.user?.id) || null;
    const authToken = localStorage.getItem('token');
    
    if (!userId || !authToken) {
      console.log('User not authenticated or missing token in loadGoals');
      setGoals([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userGoals = await goalService.getGoals(userId);
      setGoals(Array.isArray(userGoals) ? userGoals : []);
    } catch (err) {
      console.error('Error loading goals:', err);
      setError(err.message || 'Failed to load goals');
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const addGoal = useCallback(async (goal) => {
    const userId = user?.id || user?.user_id || (user?.data?.user?.id) || null;
    const authToken = localStorage.getItem('token');
    
    if (!userId || !authToken) {
      console.error('User not authenticated or missing token in addGoal');
      throw new Error('User not authenticated. Please log in again.');
    }
    
    try {
      const newGoal = await goalService.addGoal(userId, goal);
      await loadGoals();
      return newGoal;
    } catch (err) {
      console.error('Error adding goal:', err);
      throw err;
    }
  }, [user, loadGoals]);

  const updateGoal = useCallback(async (goal) => {
    const userId = user?.id || user?.user_id || (user?.data?.user?.id) || null;
    const authToken = localStorage.getItem('token');
    
    if (!userId || !authToken) {
      console.error('User not authenticated or missing token in updateGoal');
      throw new Error('User not authenticated. Please log in again.');
    }
    
    try {
      const updatedGoal = await goalService.updateGoal(userId, goal);
      await loadGoals();
      return updatedGoal;
    } catch (err) {
      console.error('Error updating goal:', err);
      throw err;
    }
  }, [user, loadGoals]);

  const deleteGoal = useCallback(async (goalId) => {
    const userId = user?.id || user?.user_id || (user?.data?.user?.id) || null;
    const authToken = localStorage.getItem('token');
    
    if (!userId || !authToken) {
      console.error('User not authenticated or missing token in deleteGoal');
      throw new Error('User not authenticated. Please log in again.');
    }
    
    try {
      await goalService.deleteGoal(userId, goalId);
      await loadGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
      throw err;
    }
  }, [user, loadGoals]);

  const value = {
    goals,
    isLoading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    refreshGoals: loadGoals
  };

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
}
