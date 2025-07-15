import React, { useState } from 'react';

const sampleGoals = [
  {
    id: 1,
    title: 'Read 20 pages',
    description: 'Finish a chapter of Atomic Habits',
    icon: '📚',
    progress: 60,
    done: false,
  },
  {
    id: 2,
    title: 'Meditation',
    description: '10 min mindfulness',
    icon: '🧘',
    progress: 100,
    done: true,
  },
  {
    id: 3,
    title: 'Workout',
    description: '30 min HIIT',
    icon: '🏋️',
    progress: 30,
    done: false,
  },
];

const tabs = ['Today', 'Week', 'Month', 'Year'];

function Confetti() {
  // Simple confetti animation (placeholder)
  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
      <span className="text-5xl animate-bounce">🎉</span>
    </div>
  );
}

export default function FuturisticGoalTrackerTest() {
  const [activeTab, setActiveTab] = useState('Today');
  const [showConfetti, setShowConfetti] = useState(false);
  const [goals, setGoals] = useState(sampleGoals);

  const handleMarkDone = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, done: true, progress: 100 } : g));
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#232526] py-10 relative">
      {/* Header */}
      <div className="glassmorphic w-full max-w-3xl rounded-3xl shadow-2xl px-8 py-6 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <span className="text-2xl font-bold text-blue-200 tracking-tight">Futuristic Goal Tracker</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-gradient-to-r from-pink-400 to-blue-400 text-white px-4 py-1 rounded-full text-sm font-semibold shadow animate-pulse">Streak: 5 days 🔥</span>
          <img src={`https://api.dicebear.com/7.x/thumbs/svg?seed=genz`} alt="avatar" className="w-10 h-10 rounded-full border-2 border-blue-400 shadow" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200
              ${activeTab === tab
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105 neon-glow'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'}
            `}
            style={{ boxShadow: activeTab === tab ? '0 0 16px #60a5fa, 0 0 32px #6366f1' : undefined }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Goals List */}
      <div className="w-full max-w-3xl flex flex-col gap-6 relative">
        {showConfetti && <Confetti />}
        {activeTab === 'Today' && goals.map(goal => (
          <div
            key={goal.id}
            className={`glassmorphic flex items-center justify-between p-6 rounded-2xl shadow-xl transition-transform hover:scale-[1.02] border border-blue-900/30 relative overflow-hidden`}
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-4xl shadow-lg">
                {goal.icon}
              </div>
              <div>
                <div className="font-bold text-xl text-blue-100 mb-1 flex items-center gap-2">
                  {goal.title}
                  {goal.done && <span className="text-green-400 text-base animate-bounce">✔️</span>}
                </div>
                <div className="text-blue-200 text-sm opacity-80">{goal.description}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 min-w-[120px]">
              {/* Circular Progress */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="absolute top-0 left-0" width="56" height="56">
                  <circle cx="28" cy="28" r="24" stroke="#334155" strokeWidth="6" fill="none" />
                  <circle
                    cx="28" cy="28" r="24"
                    stroke="#60a5fa"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (1 - goal.progress / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s' }}
                  />
                </svg>
                <span className="text-lg font-bold text-blue-200 z-10">{goal.progress}%</span>
              </div>
              <button
                className={`mt-2 px-5 py-2 rounded-full font-bold shadow transition text-base
                  ${goal.done ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600 animate-pulse'}`}
                onClick={() => !goal.done && handleMarkDone(goal.id)}
                disabled={goal.done}
              >
                {goal.done ? 'Done!' : 'Mark Today Done'}
              </button>
            </div>
          </div>
        ))}
        {activeTab !== 'Today' && (
          <div className="text-center text-blue-200/80 py-12 text-xl opacity-80">
            <span>Coming soon: {activeTab} view will show grouped goals, calendar strips, and more interactive features!</span>
          </div>
        )}
      </div>
      {/* Floating Add Button */}
      <button
        className="fixed bottom-10 right-10 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl shadow-2xl flex items-center justify-center neon-glow hover:scale-110 transition-all z-50"
        title="Add Goal"
        onClick={() => alert('Add Goal (demo only)')}
      >
        +
      </button>
      {/* Glassmorphism and neon-glow styles */}
      <style>{`
        .glassmorphic {
          background: rgba(30, 41, 59, 0.7);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .neon-glow {
          box-shadow: 0 0 16px #60a5fa, 0 0 32px #6366f1;
        }
      `}</style>
    </div>
  );
} 