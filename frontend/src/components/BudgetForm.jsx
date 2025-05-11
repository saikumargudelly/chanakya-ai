import React, { useState } from 'react';
import axios from 'axios';
import NotificationToast from './NotificationToast';

import { useAuth } from './AuthContext';

const BudgetForm = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('info');
  const [showFinancialPosition, setShowFinancialPosition] = useState(false);
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [results, setResults] = useState(null); // { totalIncome, totalExpenses, savings, status }
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  // Fetch and pre-populate latest budget
  React.useEffect(() => {
    async function fetchLatestBudget() {
      try {
        const res = await axios.get('http://localhost:5001/budget', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const budgets = res.data.budgets || [];
        if (budgets.length > 0) {
          // Find the latest budget by timestamp
          const latest = budgets.reduce((a, b) => new Date(a.timestamp) > new Date(b.timestamp) ? a : b);
          setIncome(latest.income || '');
          // If expenses is an object, convert to + separated string for the input
          if (latest.expenses && typeof latest.expenses === 'object') {
            const expenseVals = Object.values(latest.expenses).filter(v => v !== '').map(Number).filter(v => !isNaN(v));
            setExpenses(expenseVals.join('+'));
          } else if (typeof latest.expenses === 'string') {
            setExpenses(latest.expenses);
          } else {
            setExpenses('');
          }
        }
      } catch (err) {
        // Ignore fetch errors for now
      }
    }
    if (token) fetchLatestBudget();
  }, [token]);

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

  // Auto Feedback Engine
  function evaluateFeedbackRules(totalIncome, expensesStr) {
    let feedbacks = [];
    let expenseParts = expensesStr.split('+').map(e => Number(e.trim())).filter(e => !isNaN(e));
    let rent = 0, savings = 0, surplusArr = [];
    // Try to parse rent and savings if user enters as 'rent+food+savings' etc.
    // For now, assume first number is rent, last is savings if more than 2 parts
    if (expenseParts.length > 1) {
      rent = expenseParts[0];
      savings = expenseParts[expenseParts.length-1];
    } else {
      rent = 0;
      savings = 0;
    }
    // Rule 1
    if (rent > 0.5 * totalIncome) {
      feedbacks.push('Rent seems high — shall we look at ways to reduce fixed expenses?');
    }
    // Rule 2
    if (savings < 0.1 * totalIncome) {
      feedbacks.push('Try aiming for 10% savings — even ₹500 counts!');
    }
    // Rule 3: 3 consecutive weeks with 0 surplus (simulate with 0 savings for now)
    if (savings === 0) {
      feedbacks.push('No surplus left — let’s review your spending!');
    }
    return feedbacks;
  }

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

    // --- Auto Feedback Engine ---
    const feedbacks = evaluateFeedbackRules(totalIncome, expenses);
    if (feedbacks.length) {
      setToastMsg(feedbacks.join(' '));
      setToastType('warning');
      setShowToast(true);
    }
    // --- End Auto Feedback Engine ---

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
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        {showFinancialPosition ? (
          <FinancialPosition onClose={() => setShowFinancialPosition(false)} />
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-green-700 dark:text-green-300 tracking-tight flex items-center gap-2">
              <span>💸</span> Budget Tracker
              <button className="ml-auto px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 transition" onClick={() => setShowFinancialPosition(true)}>
                Open Financial Position
              </button>
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
            {showToast && (
              <NotificationToast
                message={toastMsg}
                type={toastType}
                onClose={() => setShowToast(false)}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};

const FinancialPosition = require('./FinancialPosition').default;

export default BudgetForm;
