import api from '../api';

const MOOD_API = {
  // Log a new mood entry
  logMood: async (moodData) => {
    try {
      const response = await api.post('/api/mood/log', moodData);
      return response.data;
    } catch (error) {
      console.error('Error logging mood:', error);
      throw error;
    }
  },

  // Get mood history
  getMoodHistory: async (params = {}) => {
    try {
      const response = await api.get('/api/mood/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching mood history:', error);
      throw error;
    }
  },

  // Get mood statistics
  getMoodStats: async (params = {}) => {
    try {
      const response = await api.get('/api/mood/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching mood statistics:', error);
      throw error;
    }
  },

  // Get current mood
  getCurrentMood: async () => {
    try {
      const response = await api.get('/api/mood/current');
      return response.data;
    } catch (error) {
      console.error('Error fetching current mood:', error);
      throw error;
    }
  },

  // Update a mood entry
  updateMoodEntry: async (entryId, moodData) => {
    try {
      const response = await api.put(`/api/mood/entries/${entryId}`, moodData);
      return response.data;
    } catch (error) {
      console.error('Error updating mood entry:', error);
      throw error;
    }
  },

  // Delete a mood entry
  deleteMoodEntry: async (entryId) => {
    try {
      const response = await api.delete(`/api/mood/entries/${entryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      throw error;
    }
  },
};

export default MOOD_API;
