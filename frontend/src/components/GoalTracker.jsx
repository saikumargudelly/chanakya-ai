import React, { useState } from 'react';
import GoalList from './GoalList';
import GoalModal from './GoalModal';
import GoalItem from './GoalItem';
import { useGoals } from '../context/GoalContext';

function getGoalIdFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/goalId=(\w+)/);
  return match ? match[1] : null;
}

export default function GoalTracker() {
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const { goals } = useGoals();
  const goalId = getGoalIdFromHash();
  const goal = goalId ? goals.find(g => String(g.id) === String(goalId)) : null;

  return (
    <div className="p-6">
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
    </div>
  );
}
