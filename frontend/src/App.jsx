import React, { useState } from 'react';
import ChatBox from './components/ChatBox';
import BudgetForm from './components/BudgetForm';
import BudgetAnalytics from './components/BudgetAnalytics';
import FinancialPosition from './components/FinancialPosition';
import MoodTracker from './components/MoodTracker';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import GoalTracker from './components/GoalTracker';
import GoalList from './components/GoalList';
import GoalItem from './components/GoalItem';

import GoalModal from './components/GoalModal';
import { GoalProvider, useGoals } from './context/GoalContext';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';

function App() {
  return (
    <AuthProvider>
      <GoalProvider>
        <AppContent />
      </GoalProvider>
    </AuthProvider>
  );
}

import UserDropdown from './components/UserDropdown';
import Profile from './components/Profile';

function AppContent() {
  const { user } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { goals } = useGoals();
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(!window.location.hash || window.location.hash === '#dashboard');
  const [showGoalTracker, setShowGoalTracker] = useState(window.location.hash.startsWith('#goal-tracker'));
  const [showFinancialPosition, setShowFinancialPosition] = useState(window.location.hash.startsWith('#financial-position'));
  const [showBudgetAnalytics, setShowBudgetAnalytics] = useState(window.location.hash.startsWith('#budget-analytics'));
  const [showProfile, setShowProfile] = useState(false);

  React.useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      setShowDashboard(!hash || hash === '#dashboard');
      setShowGoalTracker(hash.startsWith('#goal-tracker'));
      setShowFinancialPosition(hash.startsWith('#financial-position'));
      setShowBudgetAnalytics(hash.startsWith('#budget-analytics'));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Always scroll to top after main view changes (with setTimeout for robust effect)
  React.useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 0);
  }, [showDashboard, showGoalTracker, showBudgetAnalytics, showFinancialPosition]);

  // Top bar with title and user/profile controls
  const TopBar = (
    <header className="w-full flex items-center justify-between px-8 py-4 bg-gray-800 shadow fixed top-0 left-0 z-50" style={{height:'64px'}}>
      <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Chanakya – AI Financial Wellness Coach</h1>
      <div>
        {user ? (
          <UserDropdown onProfileClick={() => setShowProfile(true)} />
        ) : (
          <>
            <button className="bg-blue-600 text-white px-4 py-2 rounded mr-2" onClick={() => { setShowLogin(true); setShowSignup(false); }}>Login</button>
            <button className="bg-gray-700 text-white px-4 py-2 rounded" onClick={() => { setShowSignup(true); setShowLogin(false); }}>Sign Up</button>
          </>
        )}
      </div>
    </header>
  );

  if (!user) {
    if (showLogin || showSignup) {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
          {TopBar}
          <div className="flex-1 flex items-center justify-center pt-24">
            {showSignup ? (
              <Signup onLoginClick={() => { setShowSignup(false); setShowLogin(true); }} />
            ) : (
              <Login onSignupClick={() => { setShowSignup(true); setShowLogin(false); }} />
            )}
          </div>
        </div>
      );
    }
    // Show Home page by default
    return <Home onLogin={() => setShowLogin(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {TopBar}
      {showProfile && <Profile onClose={() => setShowProfile(false)} />}
      <Sidebar />
      <main className="flex-1 ml-56 p-8 pt-32 bg-gray-900 text-gray-100 min-h-screen">
        {/* UserDropdown is now in TopBar */}
        {showBudgetAnalytics ? (
          <BudgetAnalytics />
        ) : showGoalTracker ? (
          <GoalTracker />
        ) : showFinancialPosition ? (
          <FinancialPosition />
        ) : showDashboard ? (
          <>
            {/* Remove duplicate dashboard title if present */}
            <section id="dashboard" className="mb-8">
              <Dashboard />
            </section>
            <section className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
              <GoalModal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} />
              {/* Left: Budget + Goals (stacked, 40%) */}
              <div className="md:col-span-2 flex flex-col gap-8">
                <div id="budget">
                  <BudgetForm />
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <h2 className="text-lg font-semibold">🎯 Goals</h2>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700" onClick={() => setGoalModalOpen(true)}>+ Add Goal</button>
                  </div>
                  {/* Overall Progress Bar */}
                  {goals.length > 0 && (() => {
                    const totalSaved = goals.reduce((sum, g) => sum + (g.savedAmount || 0), 0);
                    const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
                    const overallProgress = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;
                    return (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Overall Savings Progress</span>
                          <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">{overallProgress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div className="bg-blue-500 h-3 rounded-full transition-all duration-700" style={{ width: `${overallProgress}%` }}></div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300 tracking-tight flex items-center gap-2">
                      <span>🎯</span> Goals
                    </h2>
                    {goals.length === 0 ? (
                      <div className="text-lg">No goals set yet. Add one!</div>
                    ) : (
                      <div className="space-y-2">
                        {goals.map(goal => (
                          <GoalItem key={goal.id} goal={goal} compact={true} />
                        ))}
                      </div>
                    )}
                  </div>
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
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;
