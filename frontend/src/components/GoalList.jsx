import React from 'react';
import { useGoals } from '../context/GoalContext';
import GoalItem from './GoalItem';

export default function GoalList({ onAddGoal }) {
  const { goals, loading } = useGoals();

  if (loading) return <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 text-center text-lg">Loading goals...</div>;
  if (!goals.length) return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 text-center text-lg">
      No goals set yet. Add one!

    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 tracking-tight flex items-center gap-2">
          <span>🎯</span> Goals
        </h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700" onClick={onAddGoal}>+ Add Goal</button>
      </div>
      <div className="space-y-4">
        {goals.map(goal => (
          <GoalItem key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
