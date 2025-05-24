import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { goalService } from '../services/goalService';
import { useAuth } from '../components/AuthContext';

const GoalContext = createContext();

// Helper function to get user ID from user object
const getUserId = (user) => {
  if (!user) return null;
  return user.userId || user.user_id || user.id;
};

export function GoalProvider({ children }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGoals = useCallback(async () => {
    const userId = getUserId(user);
    console.log('Loading goals for user ID:', userId);
    
    if (!userId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      const userGoals = await goalService.getGoals(userId);
      setGoals(userGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const addGoal = async (goal) => {
    const userId = getUserId(user);
    console.log('Adding goal for user ID:', userId);
    
    if (!userId) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    try {
      const newGoal = { ...goal, userId };
      await goalService.addGoal(userId, newGoal);
      await loadGoals();
      return newGoal;
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  };

  const updateGoal = async (goal) => {
    const userId = getUserId(user);
    if (!userId) throw new Error('User not authenticated');
    await goalService.updateGoal(userId, goal);
    await loadGoals();
  };

  const deleteGoal = async (goalId) => {
    const userId = getUserId(user);
    if (!userId) throw new Error('User not authenticated');
    await goalService.deleteGoal(userId, goalId);
    await loadGoals();
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

export function useGoals() {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
}
