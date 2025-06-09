import React, { useState, useEffect } from 'react';
import { useGoals } from '../context/GoalContext';
import { useAuth } from '../components/AuthContext.jsx';
import { v4 as uuidv4 } from 'uuid';

export default function GoalModal({ isOpen, onClose }) {
  const { addGoal } = useGoals();
  const { user, isLoading } = require('../components/AuthContext.jsx').useAuth();
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadlineMonths, setDeadlineMonths] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal is closed
      setGoalName('');
      setTargetAmount('');
      setDeadlineMonths('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if user is authenticated
    if (!user) {
      setError('You need to be logged in to add a goal');
      return;
    }

    // Basic validation
    if (!goalName.trim()) {
      setError('Goal name is required');
      return;
    }
    
    // Validate target amount
    const targetAmountValue = parseFloat(targetAmount);
    if (isNaN(targetAmountValue) || targetAmountValue <= 0) {
      setError('Please enter a valid target amount (must be greater than 0)');
      return;
    }
    
    // Validate deadline months
    const deadlineMonthsValue = parseInt(deadlineMonths, 10);
    if (isNaN(deadlineMonthsValue) || deadlineMonthsValue < 1) {
      setError('Please enter a valid timeline (at least 1 month)');
      return;
    }

    // Check for token in localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    try {
      await addGoal({
        goalName: goalName.trim(),
        targetAmount: targetAmountValue,
        deadlineMonths: deadlineMonthsValue,
        savedAmount: 0
      });
      onClose();
    } catch (err) {
      // Handle different types of errors
      if (err.response?.data?.detail) {
        // Handle API validation errors
        setError(err.response.data.detail);
      } else if (err.message && err.message.toLowerCase().includes('credential')) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.message || 'Failed to add goal. Please try again.');
      }
      console.error('Error adding goal:', err);
    }
  };

  if (!isOpen) return null;
  if (isLoading) {
    return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md text-lg text-center">Loading user...</div></div>;
  }
  if (!user) {
    return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md text-lg text-center">Please log in to add a goal.</div></div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add New Goal</h2>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Goal Name
            </label>
            <input
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="E.g., Buy a car"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Amount (₹)
            </label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="E.g., 500000"
              min="1"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Timeline (months)
            </label>
            <input
              type="number"
              value={deadlineMonths}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow positive integers or empty string
                if (value === '' || /^\d+$/.test(value)) {
                  setDeadlineMonths(value);
                }
              }}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="E.g., 12"
              min="1"
              step="1"
              inputMode="numeric"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
