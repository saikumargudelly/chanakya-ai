import api from '../api';

const BUDGET_API = {
  // Get all budgets
  getBudgets: async () => {
    const response = await api.get('/budgets');
    return response.data;
  },

  // Create a new budget
  createBudget: async (budgetData) => {
    const response = await api.post('/budgets', budgetData);
    return response.data;
  },

  // Update a budget
  updateBudget: async (budgetId, budgetData) => {
    const response = await api.put(`/budgets/${budgetId}`, budgetData);
    return response.data;
  },

  // Delete a budget
  deleteBudget: async (budgetId) => {
    const response = await api.delete(`/budgets/${budgetId}`);
    return response.data;
  },

  // Get budget by ID
  getBudgetById: async (budgetId) => {
    const response = await api.get(`/budgets/${budgetId}`);
    return response.data;
  },

  // Get budget summary
  getBudgetSummary: async () => {
    const response = await api.get('/budgets/summary');
    return response.data;
  },
};

export default BUDGET_API;
