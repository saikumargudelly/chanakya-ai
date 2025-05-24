import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { goalService } from '../services/goalService';
import { useAuth } from '../components/AuthContext.jsx';

const GoalContext = createContext();

export function useGoals() {
  return useContext(GoalContext);
}

export function GoalProvider({ children }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Debug: Log user object and its properties
  useEffect(() => {
    console.log('GoalContext - Current user:', user);
    console.log('GoalContext - User ID:', user?.userId || user?.id);
  }, [user]);

  const loadGoals = useCallback(async () => {
    const userId = user?.userId || user?.user_id || user?.id;
    console.log('loadGoals - User ID:', userId, 'from user object:', user);
    if (!userId) {
      console.log('loadGoals - No user ID found, setting empty goals');
      setGoals([]);
      setLoading(false);
      return;
    }
    try {
      const userGoals = await goalService.getGoals(userId);
      setGoals(Array.isArray(userGoals) ? userGoals : []);
    } catch (error) {
      console.error('Error loading goals:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId, user?.id]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const addGoal = async (goal) => {
    console.log('addGoal - User object:', user);
    const userId = user?.userId || user?.user_id || user?.id;
    console.log('addGoal - User ID:', userId, 'from user object:', user);
    if (!userId) {
      console.error('addGoal - No user ID found in user object:', user);
      throw new Error('User not authenticated. Please log in again.');
    }
    try {
      const newGoal = await goalService.addGoal(userId, goal);
      setGoals(prev => [...(Array.isArray(prev) ? prev : []), newGoal]);
      return newGoal;
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  };

  const updateGoal = async (goal) => {
    const userId = user?.userId || user?.user_id || user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    try {
      const updatedGoal = await goalService.updateGoal(userId, goal);
      setGoals(prev => (Array.isArray(prev) ? prev : []).map(g => g.id === goal.id ? updatedGoal : g));
      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  };

  const deleteGoal = async (goalId) => {
    const userId = user?.userId || user?.user_id || user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    try {
      await goalService.deleteGoal(userId, goalId);
      setGoals(prev => (Array.isArray(prev) ? prev : []).filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  };

  return (
    <GoalContext.Provider value={{ 
      goals, 
      addGoal, 
      updateGoal, 
      deleteGoal, 
      loading,
      refreshGoals: loadGoals
    }}>
      {children}
    </GoalContext.Provider>
  );
}
