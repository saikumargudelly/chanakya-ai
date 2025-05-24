// Abstraction layer for goal storage. Start with localStorage, easily swappable for Firebase later.
const getStorageKey = (userId) => `user_${userId}_goals`;

export const goalService = {
  getGoals: async (userId) => {
    if (!userId) return [];
    const data = localStorage.getItem(getStorageKey(userId));
    return data ? JSON.parse(data) : [];
  },
  addGoal: async (userId, goal) => {
    if (!userId) throw new Error('User ID is required');
    const goals = await goalService.getGoals(userId);
    goals.push(goal);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(goals));
    return goal;
  },
  updateGoal: async (userId, updatedGoal) => {
    if (!userId) throw new Error('User ID is required');
    let goals = await goalService.getGoals(userId);
    goals = goals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(goals));
    return updatedGoal;
  },
  deleteGoal: async (userId, goalId) => {
    if (!userId) throw new Error('User ID is required');
    let goals = await goalService.getGoals(userId);
    goals = goals.filter(g => g.id !== goalId);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(goals));
  }
};

// To migrate to Firebase, replace these methods with Firebase SDK calls.
