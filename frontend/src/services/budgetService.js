import api from './api';

/**
 * Fetches the current month's budget data
 * @returns {Promise<Object>} Budget data
 */
export const getCurrentMonthBudget = async (token) => {
  try {
    const response = await api.get('/budget');
    // The backend returns a single budget object, not an array
    return response.data;
  } catch (error) {
    console.error('Error fetching budget:', error);
    // If we get a 401 error, clear local storage and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

/**
 * Saves budget data
 * @param {number} income - Monthly income
 * @param {Object} expenses - Expense categories
 * @returns {Promise<Object>} Saved budget data
 */
export const saveBudget = async (income, expenses, token) => {
  try {
    const response = await api.post('/budget', {
      income,
      expenses
    });
    return response.data;
  } catch (error) {
    console.error('Error saving budget:', error);
    // If we get a 401 error, clear local storage and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

export default {
  getCurrentMonthBudget,
  saveBudget
};
