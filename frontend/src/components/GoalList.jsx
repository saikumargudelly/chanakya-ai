import React from 'react';
import { useGoals } from '../context/GoalContext';
import GoalItem from './GoalItem';

export default function GoalList() {
  const { goals, loading } = useGoals();

  if (loading) return <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 text-center text-lg">Loading goals...</div>;
  if (!goals.length) return <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 text-center text-lg">No goals set yet. Add one!</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300 tracking-tight flex items-center gap-2">
        <span>🎯</span> Goals
      </h2>
      <div className="space-y-4">
        {goals.map(goal => (
          <GoalItem key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
