import apiService from '../api/api';

export const goalService = {
  getGoals: async (userId) => {
    try {
      const response = await apiService.get('/goals/');
      return response.data;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  addGoal: async (userId, goal) => {
    try {
      return await apiService.post('/goals/', goal);
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  },

  updateGoal: async (userId, goal) => {
    try {
      return await apiService.put(`/goals/${goal.id}/`, goal);
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  },

  deleteGoal: async (userId, goalId) => {
    try {
      return await apiService.delete(`/goals/${goalId}/`);
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }
};
