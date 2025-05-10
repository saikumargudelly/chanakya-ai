import React, { useState } from 'react';
import { useGoals } from '../context/GoalContext';
import { v4 as uuidv4 } from 'uuid';

export default function GoalModal({ isOpen, onClose }) {
  const { addGoal } = useGoals();
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadlineMonths, setDeadlineMonths] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goalName || !targetAmount || !deadlineMonths) return;
    await addGoal({
      id: uuidv4(),
      goalName,
      targetAmount: Number(targetAmount),
      deadlineMonths: Number(deadlineMonths),
      createdAt: new Date().toISOString(),
      savedAmount: 0
    });
    setGoalName('');
    setTargetAmount('');
    setDeadlineMonths('');
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300 tracking-tight flex items-center gap-2">
          <span>🎯</span> Set a New Goal
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Goal Name:
            <input className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition" value={goalName} onChange={e => setGoalName(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Target Amount (₹):
            <input className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition" type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Deadline (months):
            <input className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition" type="number" value={deadlineMonths} onChange={e => setDeadlineMonths(e.target.value)} required />
          </label>
          <div className="flex gap-2 mt-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition">Set Goal</button>
            <button type="button" className="px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold shadow hover:bg-gray-800 transition" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
