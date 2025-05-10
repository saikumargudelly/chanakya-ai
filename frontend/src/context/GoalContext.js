import React, { createContext, useContext, useEffect, useState } from 'react';
import { goalService } from '../services/goalService';

const GoalContext = createContext();

export function useGoals() {
  return useContext(GoalContext);
}

export function GoalProvider({ children }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    goalService.getGoals().then(setGoals).finally(() => setLoading(false));
  }, []);

  const addGoal = async (goal) => {
    const newGoal = await goalService.addGoal(goal);
    setGoals((prev) => [...prev, newGoal]);
  };

  const updateGoal = async (goal) => {
    await goalService.updateGoal(goal);
    setGoals((prev) => prev.map((g) => g.id === goal.id ? goal : g));
  };

  const deleteGoal = async (id) => {
    await goalService.deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <GoalContext.Provider value={{ goals, addGoal, updateGoal, deleteGoal, loading }}>
      {children}
    </GoalContext.Provider>
  );
}
