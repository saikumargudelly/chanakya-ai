import React, { useState } from 'react';
import { useGoals } from '../context/GoalContext';
import {
  calculateMonthlySaving,
  calculateWeeklySaving,
  calculateProgress,
  calculateConfidenceScore,
  getMilestone
} from '../utils/goalCalculations';

import PropTypes from 'prop-types';

export default function GoalItem({ goal, compact = false }) {
  const { updateGoal, deleteGoal } = useGoals();
  const [addAmount, setAddAmount] = useState('');
  const [showMilestone, setShowMilestone] = useState(false);

  const progress = calculateProgress(goal.savedAmount, goal.targetAmount);
  const monthsPassed = Math.max(1, Math.floor((new Date() - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24 * 30)));
  const confidence = calculateConfidenceScore(goal.savedAmount, goal.targetAmount, monthsPassed, goal.deadlineMonths);
  const milestoneMsg = getMilestone(progress);

  const handleAdd = async () => {
    if (!addAmount) return;
    const updated = { ...goal, savedAmount: goal.savedAmount + Number(addAmount) };
    await updateGoal(updated);
    setAddAmount('');
    if (getMilestone(calculateProgress(updated.savedAmount, updated.targetAmount)) !== getMilestone(progress)) {
      setShowMilestone(true);
      setTimeout(() => setShowMilestone(false), 3000);
    }
  };

  if (compact) {
    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => window.location.hash = `#goal-tracker?goalId=${goal.id}`}
        title="View goal tracker"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <span className="font-bold text-blue-700 dark:text-blue-300 text-base">{goal.goalName}</span>
        </div>
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{progress.toFixed(1)}%</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 mb-4 hover:shadow-xl transition-shadow cursor-pointer group"
      onClick={e => {
        // Prevent navigation if clicking on Add/Delete
        if (e.target.closest('button,input')) return;
        window.location.hash = `#goal-tracker?goalId=${goal.id}`;
      }}
      title="View goal tracker"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <span className="font-bold text-blue-700 dark:text-blue-300 text-base">{goal.goalName}</span>
        </div>
        <div className="flex items-center gap-2 min-w-[140px]">
          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{progress.toFixed(1)}%</span>
        </div>
      </div>
      <div className="text-sm mb-1">Target: <span className="font-bold">₹{goal.targetAmount}</span></div>
      <div className="text-sm mb-1">Deadline: <span className="font-bold">{goal.deadlineMonths} months</span></div>
      <div className="text-sm mb-1">Required Monthly Saving: <span className="font-bold">₹{calculateMonthlySaving(goal.targetAmount, goal.deadlineMonths).toFixed(2)}</span></div>
      <div className="text-sm mb-1">Required Weekly Saving: <span className="font-bold">₹{calculateWeeklySaving(goal.targetAmount, goal.deadlineMonths).toFixed(2)}</span></div>
      <div className="text-sm mb-1">Confidence Score: <span className="font-bold">{confidence.toFixed(0)}%</span></div>
      <div className="flex gap-2 mt-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition text-sm" type="number" placeholder="Add savings" value={addAmount} onChange={e => setAddAmount(e.target.value)} />
        <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition text-sm" onClick={e => { e.stopPropagation(); handleAdd(); }}>Add</button>
        <button className="px-3 py-2 rounded-lg bg-gray-700 text-white font-semibold shadow hover:bg-gray-800 transition text-sm" onClick={e => { e.stopPropagation(); deleteGoal(goal.id); }}>Delete</button>
      </div>
      {showMilestone && milestoneMsg && <div className="milestone-msg mt-2 text-green-500 font-semibold animate-pulse">{milestoneMsg}</div>}
    </div>
  );
}
