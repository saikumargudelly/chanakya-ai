import api from '../api';

const BUDGET_API = {
  // Get all budgets
  getBudgets: async () => {
    try {
      const response = await api.get('/api/budgets');
      return response.data;
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw error;
    }
  },

  // Create a new budget
  createBudget: async (budgetData) => {
    try {
      const response = await api.post('/api/budgets', budgetData);
      return response.data;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  },

  // Update a budget
  updateBudget: async (budgetId, budgetData) => {
    try {
      const response = await api.put(`/api/budgets/${budgetId}`, budgetData);
      return response.data;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  },

  // Delete a budget
  deleteBudget: async (budgetId) => {
    try {
      const response = await api.delete(`/api/budgets/${budgetId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  },

  // Get budget by ID
  getBudgetById: async (budgetId) => {
    try {
      const response = await api.get(`/api/budgets/${budgetId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching budget:', error);
      throw error;
    }
  },

  // Get budget summary
  getBudgetSummary: async () => {
    try {
      const response = await api.get('/api/budgets/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching budget summary:', error);
      throw error;
    }
  },
};

export default BUDGET_API;
