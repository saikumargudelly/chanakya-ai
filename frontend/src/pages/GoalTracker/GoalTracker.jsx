import React, { useState } from 'react';
import GoalList from '../../components/goals/GoalList';
import GoalModal from '../../components/goals/GoalModal';
import GoalItem from '../../components/goals/GoalItem';
import { useGoals } from '../../context/GoalContext';
import { useAuth } from '../../context/AuthContext';
import { GoalMasterChat } from '../../components/goals/GoalMasterChat';
import Sidebar from '../../components/layout/Sidebar';
import TopNav from '../../components/layout/TopNav';
import Profile from '../../components/common/Profile';

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
  const [showProfile, setShowProfile] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen ml-64">
          <TopNav setShowProfile={setShowProfile} />
          <main className="flex-1 p-6 md:p-10 bg-gray-950">
            <div className="p-6 text-lg text-center text-gray-100">Loading user...</div>
          </main>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen ml-64">
          <TopNav setShowProfile={setShowProfile} />
          <main className="flex-1 p-6 md:p-10 bg-gray-950">
            <div className="p-6 text-lg text-center text-gray-100">Please log in to manage your goals.</div>
          </main>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <TopNav setShowProfile={setShowProfile} />
        <main className="flex-1 p-6 md:p-10 bg-gray-950">
          <div className="p-6 text-gray-100">
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
                   Back to all goals
                </button>
              </div>
            ) : (
              <GoalList />
            )}
            <GoalModal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} />
            <GoalMasterChat />
            {showProfile && <Profile onClose={() => setShowProfile(false)} />}
          </div>
        </main>
      </div>
    </div>
  );
}
