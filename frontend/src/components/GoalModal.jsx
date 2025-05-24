import React, { useState, useEffect } from 'react';
import { useGoals } from '../context/GoalContext';
import { useAuth } from '../components/AuthContext.jsx';
import { v4 as uuidv4 } from 'uuid';

export default function GoalModal({ isOpen, onClose }) {
  const { addGoal } = useGoals();
  const { user } = useAuth();
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

    // Debug: Log user object
    console.log('Current user object:', user);
    console.log('User ID from user object:', user?.userId || user?.id);
    console.log('Is user authenticated?', !!user);

    // Check if user is authenticated
    if (!user) {
      console.error('No user object found');
      setError('You need to be logged in to add a goal');
      return;
    }

    // Basic validation
    if (!goalName.trim()) {
      setError('Goal name is required');
      return;
    }
    if (!targetAmount || isNaN(targetAmount) || Number(targetAmount) <= 0) {
      setError('Please enter a valid target amount');
      return;
    }
    if (!deadlineMonths || isNaN(deadlineMonths) || Number(deadlineMonths) < 1) {
      setError('Please enter a valid timeline (at least 1 month)');
      return;
    }

    try {
      await addGoal({
        id: uuidv4(),
        goalName: goalName.trim(),
        targetAmount: parseFloat(targetAmount),
        deadlineMonths: parseInt(deadlineMonths, 10),
        createdAt: new Date().toISOString(),
        savedAmount: 0
      });
      onClose();
    } catch (err) {
      console.error('Error adding goal:', err);
      setError(err.message || 'Failed to add goal. Please try again.');
    }
  };

  if (!isOpen) return null;

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
              onChange={(e) => setDeadlineMonths(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="E.g., 12"
              min="1"
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
