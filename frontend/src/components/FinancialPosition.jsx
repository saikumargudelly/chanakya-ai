import React, { useState, useEffect } from 'react';
import FinancialPieChart from './FinancialPieChart';

const defaultCategories = [
  { key: 'rent', label: 'Rent', value: '' },
  { key: 'food', label: 'Food & Groceries', value: '' },
  { key: 'transport', label: 'Transport', value: '' },
  { key: 'utilities', label: 'Utilities', value: '' },
  { key: 'entertainment', label: 'Entertainment', value: '' },
  { key: 'other', label: 'Other', value: '' },
  { key: 'savings', label: 'Savings', value: '' },
];

import axios from 'axios';

export default function FinancialPosition({ onClose }) {
  const [income, setIncome] = useState('');
  const [categories, setCategories] = useState(defaultCategories);
  const [feedback, setFeedback] = useState('');
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    async function fetchCurrentMonth() {
      try {
        const res = await axios.get('http://localhost:5001/budget', { params: { user_id: 1 } });
        const budgets = res.data.budgets || [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const thisMonth = budgets.find(b => {
          const d = new Date(b.timestamp);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        if (thisMonth) {
          setIncome(thisMonth.income);
          setCategories(defaultCategories.map(cat => ({ ...cat, value: thisMonth.expenses?.[cat.key] ?? '' })));
          setShowResult(true);
        }
      } catch {}
    }
    fetchCurrentMonth();
  }, []);

  function handleCategoryChange(idx, value) {
    setCategories(categories => categories.map((cat, i) => i === idx ? { ...cat, value } : cat));
  }

  async function evaluateRules() {
    // Only use non-empty values for calculations
    const totalIncome = Number(income) || 0;
    const filteredCategories = categories.filter(c => c.value !== '' && !isNaN(Number(c.value)));
    const catObj = Object.fromEntries(filteredCategories.map(c => [c.key, Number(c.value)]));
    const totalExpenses = filteredCategories.filter(c => c.key !== 'savings').reduce((sum, c) => sum + Number(c.value), 0);
    const savings = Number(catObj.savings) || 0;
    let result = [];

    // Guide: How much should user save?
    const recommendedSavings = Math.round(0.1 * totalIncome);
    result.push(`Recommended savings: ₹${recommendedSavings.toLocaleString()} (10% of income)`);

    // User's current situation
    result.push(`Your current savings: ₹${savings.toLocaleString()}`);
    result.push(`Total income: ₹${totalIncome.toLocaleString()}`);
    result.push(`Total expenses: ₹${totalExpenses.toLocaleString()}`);

    // Actionable advice
    if (totalIncome === 0) {
      result.push('Please enter your income.');
    } else {
      if (savings < recommendedSavings) {
        result.push('Try to increase your savings to at least 10% of your income.');
      } else {
        result.push('Great! You are saving well.');
      }
      if (catObj.rent && catObj.rent > 0.5 * totalIncome) {
        result.push('Rent seems high — consider ways to reduce fixed expenses.');
      }
      if (totalIncome - totalExpenses - savings < 0) {
        result.push('You are running a deficit. Review your spending.');
      }
    }

    setFeedback(result.join(' '));
    setShowResult(true);

    // Send details to backend for analytics
    try {
      await axios.post('http://localhost:5001/budget', {
        user_id: 1, // static for now
        income: totalIncome,
        expenses: catObj
      });
      setFeedback(prev => prev + ' (Saved to analytics!)');
    } catch (err) {
      setFeedback(prev => prev + ' (Failed to save to backend.)');
    }
  }

  return (
    <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 max-w-4xl mx-auto mt-8 relative gap-8">
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
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">Detailed Financial Position</h2>
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2">Monthly Income</label>
          <input
            type="number"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition w-full"
            value={income}
            onChange={e => setIncome(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2">Expenses by Category</label>
          {categories.map((cat, idx) => (
            <div key={cat.key} className="flex gap-3 items-center mb-2">
              <span className="w-36">{cat.label}</span>
              <input
                type="number"
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition w-32"
                value={cat.value}
                onChange={e => handleCategoryChange(idx, e.target.value)}
              />
            </div>
          ))}
        </div>
        <button
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:from-blue-600 hover:to-indigo-700 transition mt-4"
          onClick={evaluateRules}
        >
          Evaluate
        </button>
      </div>

      {/* Right: Results & Pie Chart Section */}
      {showResult && (
        <div className="flex-1 min-w-[320px] flex flex-col gap-6 justify-center items-center border-l border-gray-200 dark:border-gray-700 pl-6">
          <h3 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-300">Expense Breakdown</h3>
          <FinancialPieChart expenses={Object.fromEntries(categories.map(c => [c.key, Number(c.value) || 0]))} />
          <div className="mt-2 p-4 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-gray-900 text-blue-900 dark:text-blue-200 w-full">
            <div className="font-semibold mb-1">Suggestions:</div>
            <div>{feedback}</div>
          </div>
        </div>
      )}
    </div>
  );
}
