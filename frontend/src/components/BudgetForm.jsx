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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-2">Budget Tracker</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="number"
          className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
          placeholder="Monthly Income"
          value={income}
          onChange={e => setIncome(e.target.value)}
          required
        />
        <input
          type="text"
          className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
          placeholder="Expenses (comma-separated: rent, food, ... )"
          value={expenses}
          onChange={e => setExpenses(e.target.value)}
          required
        />
        <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Log Budget</button>
      </form>
      {feedback && <div className="mt-2 text-sm text-green-500">{feedback}</div>}
    </div>
  );
};

export default BudgetForm;
