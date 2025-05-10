import React, { useState } from 'react';
import GoalList from './GoalList';
import GoalModal from './GoalModal';

export default function GoalTracker() {
  const [goalModalOpen, setGoalModalOpen] = useState(false);
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
      <GoalList />
      <GoalModal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} />
    </div>
  );
}
