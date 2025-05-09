import React, { useState } from 'react';
import axios from 'axios';

const BudgetForm = () => {
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [results, setResults] = useState(null); // { totalIncome, totalExpenses, savings, status }
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Safe arithmetic parser for simple +, - expressions
  function safeSum(expr) {
    // Only allow digits, +, -, ., and whitespace
    if (!/^[\d+\-\.\s]+$/.test(expr)) return NaN;
    try {
      // Replace multiple spaces, split by + or - keeping the operator
      let tokens = expr.replace(/\s+/g, '').match(/([+-]?\d*\.?\d+)/g);
      if (!tokens) return NaN;
      return tokens.reduce((acc, num) => acc + Number(num), 0);
    } catch {
      return NaN;
    }
  }

  const getStatus = (income, savings) => {
    if (savings < 0) return { label: 'Deficit', color: 'red', icon: '❌' };
    if (savings >= 0.2 * income) return { label: 'Surplus', color: 'green', icon: '✅' };
    return { label: 'Break-even', color: 'orange', icon: '⚠️' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);
    setAiResponse('');
    setLoading(true);
    const totalIncome = Number(income);
    const totalExpenses = safeSum(expenses);
    if (isNaN(totalIncome) || totalIncome <= 0) {
      setError('Please enter a valid income.');
      setLoading(false);
      return;
    }
    if (isNaN(totalExpenses) || totalExpenses < 0) {
      setError('Please enter a valid expenses expression.');
      setLoading(false);
      return;
    }
    const savings = totalIncome - totalExpenses;
    const status = getStatus(totalIncome, savings);
    setResults({ totalIncome, totalExpenses, savings, status });

    // Format message for AI
    const message = `User has an income of ₹${totalIncome.toLocaleString()} and spent ₹${totalExpenses.toLocaleString()}. Offer actionable savings or investment advice.`;
    try {
      const res = await axios.post('http://localhost:5001/chat', { message });
      setAiResponse(res.data.response || 'No advice received.');
    } catch {
      setAiResponse('Failed to get advice from Chanakya.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-green-700 dark:text-green-300 tracking-tight flex items-center gap-2">
        <span>💸</span> Budget Tracker
      </h2>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input
          type="number"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-700 transition"
          placeholder="Monthly Income"
          value={income}
          onChange={e => setIncome(e.target.value)}
          required
        />
        <input
          type="text"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-700 transition"
          placeholder="Expenses (e.g. 10000+3000+2000)"
          value={expenses}
          onChange={e => setExpenses(e.target.value)}
          required
        />
        <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition" disabled={loading}>{loading ? 'Calculating...' : 'Log Budget'}</button>
      </form>
      {error && <div className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 animate-pulse">{error}</div>}
      {results && (
        <div className="mt-5 p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
          <div className="mb-2 text-gray-700 dark:text-gray-200">Total Income: <span className="font-semibold">₹{results.totalIncome.toLocaleString()}</span></div>
          <div className="mb-2 text-gray-700 dark:text-gray-200">Total Expenses: <span className="font-semibold">₹{results.totalExpenses.toLocaleString()}</span></div>
          <div className="mb-2 text-gray-700 dark:text-gray-200">Remaining Savings: <span className="font-semibold">₹{results.savings.toLocaleString()}</span></div>
          <div className={`mt-2 font-bold flex items-center gap-2 text-${results.status.color}-600 dark:text-${results.status.color}-400`}>
            <span>{results.status.icon}</span> Financial Status: {results.status.label}
          </div>
        </div>
      )}
      {aiResponse && (
        <div className="mt-5 p-4 rounded-xl border border-green-200 dark:border-green-700 bg-green-50 dark:bg-gray-900 text-green-900 dark:text-green-200">
          <div className="font-semibold mb-1">Chanakya's Advice:</div>
          <div>{aiResponse}</div>
        </div>
      )}
    </div>
  );
};

export default BudgetForm;
