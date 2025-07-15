import apiService from '../api/api';

export const goalService = {
  getGoals: async (userId) => {
    try {
      const response = await apiService.get('/goals/');
      // Map backend snake_case to frontend camelCase
      return response.data.map(goal => ({
        ...goal,
        startDate: goal.start_date,
        endDate: goal.end_date,
        milestoneFrequency: goal.milestone_frequency,
        moodAware: goal.mood_aware,
      }));
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  addGoal: async (userId, goal) => {
    try {
      // Map frontend camelCase to backend snake_case
      const payload = {
        title: goal.title,
        description: goal.description,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount || 0.0,
        start_date: goal.startDate ? new Date(goal.startDate).toISOString() : null,
        end_date: goal.endDate ? new Date(goal.endDate).toISOString() : null,
        deadline: goal.deadline,
        type: goal.type,
        category: goal.category,
        milestone_frequency: goal.milestoneFrequency,
        milestones: goal.milestones || [],
        reminders: goal.reminders || [],
        vision: goal.vision,
        mood_aware: goal.moodAware || false,
      };
      
      console.log('[goalService] Sending payload:', payload);
      const response = await apiService.post('/goals/', payload);
      
      // Map response back to frontend format
      return {
        ...response.data,
        startDate: response.data.start_date,
        endDate: response.data.end_date,
        milestoneFrequency: response.data.milestone_frequency,
        moodAware: response.data.mood_aware,
      };
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  },

  updateGoal: async (userId, goal) => {
    try {
      // Map frontend camelCase to backend snake_case
      const payload = {
        title: goal.title,
        description: goal.description,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        start_date: goal.startDate ? new Date(goal.startDate).toISOString() : null,
        end_date: goal.endDate ? new Date(goal.endDate).toISOString() : null,
        deadline: goal.deadline,
        type: goal.type,
        category: goal.category,
        milestone_frequency: goal.milestoneFrequency,
        milestones: goal.milestones,
        reminders: goal.reminders,
        vision: goal.vision,
        mood_aware: goal.moodAware,
      };
      
      console.log('[goalService] Update payload:', payload);
      const response = await apiService.put(`/goals/${goal.id}/`, payload);
      
      // Map response back to frontend format
      return {
        ...response.data,
        startDate: response.data.start_date,
        endDate: response.data.end_date,
        milestoneFrequency: response.data.milestone_frequency,
        moodAware: response.data.mood_aware,
      };
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
