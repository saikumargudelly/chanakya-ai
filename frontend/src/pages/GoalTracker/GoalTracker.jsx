import React, { useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import TopNav from '../../components/layout/TopNav';
import Profile from '../../components/common/Profile';
import SmartGoalTracker from '../../components/goals/SmartGoalTracker';

export default function GoalTracker() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <TopNav setShowProfile={setShowProfile} />
        <main className="flex-1 p-6 md:p-10 bg-gray-950">
          <div className="p-6 text-gray-100">
            <SmartGoalTracker />
            {showProfile && <Profile onClose={() => setShowProfile(false)} />}
          </div>
        </main>
      </div>
    </div>
  );
}
