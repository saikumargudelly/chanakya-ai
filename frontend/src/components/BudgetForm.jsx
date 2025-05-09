import React, { useState } from 'react';
import axios from 'axios';

const BudgetForm = () => {
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback('');
    try {
      const res = await axios.post('http://localhost:5001/budget', { income, expenses });
      setFeedback(res.data.message);
    } catch (err) {
      setFeedback('Failed to submit budget.');
    }
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
          placeholder="Expenses (comma-separated: rent, food, ... )"
          value={expenses}
          onChange={e => setExpenses(e.target.value)}
          required
        />
        <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition">Log Budget</button>
      </form>
      {feedback && <div className="mt-3 text-sm font-medium text-green-600 dark:text-green-400 animate-pulse">{feedback}</div>}
    </div>
  );
};

export default BudgetForm;
