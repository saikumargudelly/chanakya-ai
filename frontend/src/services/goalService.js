// Abstraction layer for goal storage. Start with localStorage, easily swappable for Firebase later.
const STORAGE_KEY = 'user_goals';

export const goalService = {
  getGoals: async () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  addGoal: async (goal) => {
    const goals = await goalService.getGoals();
    goals.push(goal);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    return goal;
  },
  updateGoal: async (updatedGoal) => {
    let goals = await goalService.getGoals();
    goals = goals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    return updatedGoal;
  },
  deleteGoal: async (goalId) => {
    let goals = await goalService.getGoals();
    goals = goals.filter(g => g.id !== goalId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }
};

// To migrate to Firebase, replace these methods with Firebase SDK calls.
