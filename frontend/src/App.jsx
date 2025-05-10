import React, { useState } from 'react';
import ChatBox from './components/ChatBox';
import BudgetForm from './components/BudgetForm';
import MoodTracker from './components/MoodTracker';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import GoalList from './components/GoalList';
import GoalModal from './components/GoalModal';
import { GoalProvider } from './context/GoalContext';

function App() {
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  return (
    <GoalProvider>
      <div className="min-h-screen bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 ml-56 p-8 bg-gray-900 text-gray-100 min-h-screen">
          <h1 className="text-3xl font-bold mb-8 mt-2">Chanakya – AI Financial Wellness Coach</h1>
          <section id="dashboard" className="mb-8">
            <Dashboard />
          </section>
          <section className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
            {/* Left: Budget + Goals (stacked, 40%) */}
            <div className="md:col-span-2 flex flex-col gap-8">
              <div id="budget">
                <BudgetForm />
                <div className="flex items-center justify-between mt-4 mb-2">
                  <h2 className="text-lg font-semibold">🎯 Goals</h2>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700" onClick={() => setGoalModalOpen(true)}>+ Add Goal</button>
                </div>
                <GoalList />
                <GoalModal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} />
              </div>
            </div>
            {/* Right: Mood Tracker (fixed) + ChatBox */}
            <div id="chat" className="md:col-span-3 flex flex-col gap-4">
              <div className="mood-tracker-expanded sticky top-4 z-20 w-full" style={{minWidth: '320px'}}>
                <MoodTracker />
              </div>
              <ChatBox />
            </div>
          </section>
        </main>
      </div>
    </GoalProvider>
  );
}

export default App;
