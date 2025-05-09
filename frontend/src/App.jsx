import React from 'react';
import ChatBox from './components/ChatBox';
import BudgetForm from './components/BudgetForm';
import MoodTracker from './components/MoodTracker';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';


function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <main className="flex-1 ml-56 p-8 bg-gray-900 text-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-8 mt-2">Chanakya – AI Financial Wellness Coach</h1>
        <section id="dashboard" className="mb-8">
          <Dashboard />
        </section>
        <section className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Left: Budget + Mood (stacked, 40%) */}
          <div className="md:col-span-2 flex flex-col gap-8">
            <div id="budget"><BudgetForm /></div>
            <div id="mood"><MoodTracker /></div>
          </div>
          {/* Right: ChatBox (60%) */}
          <div id="chat" className="md:col-span-3 flex flex-col">
            <ChatBox />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
