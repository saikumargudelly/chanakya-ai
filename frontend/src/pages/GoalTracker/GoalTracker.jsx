import React, { useState } from 'react';
import GoalList from '../../components/goals/GoalList';
import GoalModal from '../../components/goals/GoalModal';
import GoalItem from '../../components/goals/GoalItem';
import { useGoals } from '../../context/GoalContext';
import { useAuth } from '../../context/AuthContext';
import { GoalMasterChat } from '../../components/goals/GoalMasterChat';

function getGoalIdFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/goalId=(\w+)/);
  return match ? match[1] : null;
}

export default function GoalTracker() {
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const { goals } = useGoals();
  const { user, isLoading } = useAuth();
  const goalId = getGoalIdFromHash();
  const goal = goalId ? goals.find(g => String(g.id) === String(goalId)) : null;

  if (isLoading) {
    return <div className="p-6 text-lg text-center text-gray-800 dark:text-white">Loading user...</div>;
  }
  if (!user) {
    return <div className="p-6 text-lg text-center text-gray-800 dark:text-white">Please log in to manage your goals.</div>;
  }

  return (
    <div className="p-6 text-gray-800 dark:text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Goal Tracker</h1>
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          onClick={() => setGoalModalOpen(true)}
        >
          + Add Goal
        </button>
      </div>
      {goalId && goal ? (
        <div>
          <GoalItem goal={goal} />
          <button
            className="mt-4 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            onClick={() => window.location.hash = '#goal-tracker'}
          >
            ← Back to all goals
          </button>
        </div>
      ) : (
        <GoalList />
      )}
      <GoalModal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} />
      <GoalMasterChat />
    </div>
  );
}
