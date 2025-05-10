import React, { useState } from 'react';
import { useGoals } from '../context/GoalContext';
import {
  calculateMonthlySaving,
  calculateWeeklySaving,
  calculateProgress,
  calculateConfidenceScore,
  getMilestone
} from '../utils/goalCalculations';

export default function GoalItem({ goal }) {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-4">
      <h3 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-2">
        <span>🏆</span> {goal.goalName}
      </h3>
      <div className="text-sm mb-1">Target: <span className="font-bold">₹{goal.targetAmount}</span></div>
      <div className="text-sm mb-1">Deadline: <span className="font-bold">{goal.deadlineMonths} months</span></div>
      <div className="text-sm mb-1">Required Monthly Saving: <span className="font-bold">₹{calculateMonthlySaving(goal.targetAmount, goal.deadlineMonths).toFixed(2)}</span></div>
      <div className="text-sm mb-1">Required Weekly Saving: <span className="font-bold">₹{calculateWeeklySaving(goal.targetAmount, goal.deadlineMonths).toFixed(2)}</span></div>
      <div className="text-sm mb-1">Progress: <span className="font-bold">{progress.toFixed(1)}%</span></div>
      <div className="text-sm mb-1">Confidence Score: <span className="font-bold">{confidence.toFixed(0)}%</span></div>
      <progress value={progress} max="100" className="w-full h-2 my-2 accent-blue-500"></progress>
      <div className="flex gap-2 mt-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition text-sm" type="number" placeholder="Add savings" value={addAmount} onChange={e => setAddAmount(e.target.value)} />
        <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition text-sm" onClick={handleAdd}>Add</button>
        <button className="px-3 py-2 rounded-lg bg-gray-700 text-white font-semibold shadow hover:bg-gray-800 transition text-sm" onClick={() => deleteGoal(goal.id)}>Delete</button>
      </div>
      {showMilestone && milestoneMsg && <div className="milestone-msg mt-2 text-green-500 font-semibold animate-pulse">{milestoneMsg}</div>}
    </div>
  );
}
