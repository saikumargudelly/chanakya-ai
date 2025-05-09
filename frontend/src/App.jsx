import React from 'react';
import ChatBox from './components/ChatBox';
import BudgetForm from './components/BudgetForm';
import MoodTracker from './components/MoodTracker';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto py-4">
        <h1 className="text-3xl font-bold mb-4 text-center">Chanakya – AI Financial Wellness Coach</h1>
        <Dashboard />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <BudgetForm />
          <MoodTracker />
        </div>
        <div className="mt-6">
          <ChatBox />
        </div>
      </div>
    </div>
  );
}

export default App;
