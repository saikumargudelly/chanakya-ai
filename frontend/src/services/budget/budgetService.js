import api from '../api/api';

/**
 * Fetches the current month's budget data
 * @returns {Promise<Object>} Budget data
 */
/**
 * Fetches the current month's budget data for a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} Budget data
 */
export const getCurrentMonthBudget = async (userId) => {
  try {
    const response = await api.get('/budget', {
      params: { user_id: userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching budget:', error);
    throw error; // Let the API interceptor handle the error
  }
};

/**
 * Saves budget data for a user
 * @param {string} userId - The ID of the user
 * @param {number} income - Monthly income
 * @param {Object} expenses - Expense categories
 * @returns {Promise<Object>} Saved budget data
 */
export const saveBudget = async (userId, income, expenses) => {
  try {
    const response = await api.post(
      '/budget',
      { income, expenses },
      { params: { user_id: userId } }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving budget:', error);
    throw error; // Let the API interceptor handle the error
  }
};

export default {
  getCurrentMonthBudget,
  saveBudget
};
