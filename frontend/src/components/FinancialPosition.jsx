import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import FinancialPieChart from './FinancialPieChart';
import { useAuth } from './AuthContext';
import budgetService from '../services/budgetService';

const CATEGORIES = [
  { key: 'rent', label: 'Rent' },
  { key: 'food', label: 'Food & Groceries' },
  { key: 'transport', label: 'Transport' },
  { key: 'utilities', label: 'Utilities' },
  { key: 'entertainment', label: 'Entertainment' },
  { key: 'other', label: 'Other' },
  { key: 'savings', label: 'Savings' },
];

const DEFAULT_EXPENSES = Object.fromEntries(CATEGORIES.map(cat => [cat.key, 0]));

// Define getRuleFeedback as a standard function outside of the component
const getRuleFeedback = (totalIncome, categories) => {
  const filteredCategories = categories.filter(c => c.value !== '' && !isNaN(Number(c.value)));
  const catObj = Object.fromEntries(filteredCategories.map(c => [c.key, Number(c.value)]));
  const totalExpenses = filteredCategories
    .filter(c => c.key !== 'savings')
    .reduce((sum, c) => sum + Number(c.value), 0);
  const savings = Number(catObj.savings) || 0;
  let result = [];

  // Recommendations
  const recommendedSavings = Math.round(0.1 * totalIncome);
  result.push(`Recommended savings: ₹${recommendedSavings.toLocaleString()} (10% of income)`);
  result.push(`Your current savings: ₹${savings.toLocaleString()}`);
  result.push(`Total income: ₹${totalIncome.toLocaleString()}`);
  result.push(`Total expenses: ₹${totalExpenses.toLocaleString()}`);

  // Actionable advice
  if (totalIncome === 0) {
    result.push('Please enter your income.');
  } else {
    if (savings < recommendedSavings) {
      result.push('Try to increase your savings to at least 10% of your income.');
    }
  }
  return result.join(' ');
};

export default function FinancialPosition({ onClose }) {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES);
  const [feedback, setFeedback] = useState('');

  // Fetch current month budget data
  const { data: currentBudget, isLoading: budgetLoading, error, refetch } = useQuery({
    queryKey: ['currentMonthBudget', token],
    queryFn: () => budgetService.getCurrentMonthBudget(token),
    enabled: isAuthenticated, // Only enabled when authenticated
    staleTime: 0,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data) => {
      if (data) {
        console.log('Budget data fetched successfully:', data);
        // State updates are now handled by the useEffect hook watching currentBudget

        // Generate initial feedback (still using fetched data for initial feedback)
        const categories = CATEGORIES.map(cat => ({
          ...cat,
          value: (data.expenses?.[cat.key] || 0).toString()
        }));
        // Call the standard getRuleFeedback function
        const feedbackText = getRuleFeedback(Number(data.income) || 0, categories);
        setFeedback(feedbackText);
      }
    },
    onError: () => {
      // Only show error if authenticated, otherwise it's a login issue
      if (isAuthenticated) {
         setIncome('');
         setExpenses(DEFAULT_EXPENSES);
         setFeedback('Error loading budget data. Please try again.');
      }
    }
  });

  console.log('FinancialPosition render:', { authLoading, isAuthenticated, budgetLoading });

  // Effect to log changes in fetched budget data and update state
  useEffect(() => {
    console.log('currentBudget changed:', currentBudget);
    if (currentBudget) {
      console.log('Updating state from currentBudget:', currentBudget);
      setIncome(currentBudget.income?.toString() || '');
      setExpenses(currentBudget.expenses || DEFAULT_EXPENSES);

      // Optionally update feedback here as well if it should react to data changes
      const categories = CATEGORIES.map(cat => ({
        ...cat,
        value: (currentBudget.expenses?.[cat.key] || 0).toString()
      }));
      // Call the standard getRuleFeedback function
      const feedbackText = getRuleFeedback(Number(currentBudget.income) || 0, categories);
      setFeedback(feedbackText);

    } else {
       // Reset state if currentBudget becomes null/undefined (e.g., after logout or initial load with no data)
       setIncome('');
       setExpenses(DEFAULT_EXPENSES);
       setFeedback(''); // Clear feedback on data clear
    }
  }, [currentBudget, setIncome, setExpenses, setFeedback]); // getRuleFeedback is no longer a dependency

  // Memoized categories for rendering
  const categories = useMemo(() => 
    CATEGORIES.map(cat => ({
      ...cat,
      value: expenses[cat.key]?.toString() || ''
    })),
    [expenses]  // Depend on expenses state
  );

  // Handle category value changes
  const handleCategoryChange = useCallback((key, value) => {
    const numValue = Number(value) || 0;
    setExpenses(prev => ({
      ...prev,
      [key]: numValue
    }));
  }, []); // No dependencies needed as setExpenses is stable

  // Evaluate rules and save data
  const evaluateRules = useCallback(async () => {
    const totalIncome = Number(income) || 0;
    // Call the standard getRuleFeedback function
    const feedbackText = getRuleFeedback(totalIncome, categories);
    setFeedback(feedbackText);

    // Save to backend using axios directly
    const expensesToSave = Object.fromEntries(
      Object.entries(expenses).map(([key, value]) => [key, Number(value) || 0])
    );

    try {
      await budgetService.saveBudget(totalIncome, expensesToSave, token);
      setFeedback(prev => prev + ' (Saved successfully!)');
      // Invalidate the budget query to refetch latest data after saving
      queryClient.invalidateQueries({ queryKey: ['currentMonthBudget'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      console.error('Error saving budget:', err);
      setFeedback(prev => prev + ' (Failed to save to backend.)');
       // If we get a 401 error, clear local storage and redirect to login - handled in budgetService
    }

  }, [income, expenses, categories, setFeedback, token, queryClient]); // getRuleFeedback is no longer a dependency

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Financial Position</h2>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show budget loading state if authenticated
  if (budgetLoading) {
     return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Financial Position</h2>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Financial Position</h2>
          <p className="text-red-600 dark:text-red-400 text-center mb-4">
            Error loading data. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const showResult = !!currentBudget || Object.values(expenses).some(v => v > 0);

  return (
    <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 max-w-4xl mx-auto mt-8 relative gap-8 text-gray-900 dark:text-white">
      {/* Left: Input Section */}
      <div className="flex-1 min-w-[320px]">
        <button
          className="absolute top-6 right-6 px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
          onClick={() => {
            if (typeof onClose === 'function') onClose();
            else window.location.hash = '#budget';
          }}
          title="Return to Budget Tracker"
        >
          Close & Return
        </button>
        
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">
          Detailed Financial Position
        </h2>
        
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Monthly Income</label>
          <input
            type="number"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition w-full text-gray-900 dark:text-white"
            value={income}
            onChange={e => setIncome(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Expenses by Category</label>
          {categories.map((cat) => (
            <div key={cat.key} className="flex gap-3 items-center mb-2">
              <span className="w-36">{cat.label}</span>
              <input
                type="number"
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition w-32 text-gray-900 dark:text-white"
                value={cat.value}
                onChange={e => handleCategoryChange(cat.key, e.target.value)}
              />
            </div>
          ))}
          
        </div>

        <button
          onClick={evaluateRules}
          className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 dark:focus:ring-indigo-400 transition-all duration-200"
        >
          Evaluate
        </button>

        {feedback && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="font-semibold mb-2">Suggestions:</p>
            <p>{feedback}</p>
          </div>
        )}

      </div>

      {/* Right: Chart and Suggestions */}
      <div className="flex-1 min-w-[320px]">
        {showResult && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Expense Breakdown</h3>
            <FinancialPieChart expenses={expenses} />
          </div>
        )}

        {/* Feedback Section (moved here for better layout) */}
        {!feedback && showResult && ( // Only show if there's no feedback and we have data
           <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="font-semibold mb-2">Suggestions:</p>
            <p>{getRuleFeedback(Number(income) || 0, categories)}</p> {/* Generate feedback on demand if not already there */}
           </div>
        )}
      </div>
    </div>
  );
}