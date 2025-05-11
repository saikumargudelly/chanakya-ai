import React from 'react';

const Sidebar = () => (
  <aside className="h-screen w-56 bg-gray-900 text-white flex flex-col p-4 shadow-lg fixed left-0 top-0 z-10">
    <div className="mb-10 flex items-center gap-2">
      <span className="text-2xl">💡</span>
      <span className="text-xl font-bold tracking-wide">Chanakya</span>
    </div>
    <nav className="flex flex-col gap-4">
      <a href="#dashboard" className="hover:bg-gray-800 rounded px-3 py-2 transition" onClick={e => { e.preventDefault(); window.location.hash = '#dashboard'; window.scrollTo({top: 0, behavior: 'auto'}); }}>Dashboard</a>
      <a href="#budget-analytics" className="hover:bg-gray-800 rounded px-3 py-2 transition" onClick={e => { e.preventDefault(); window.location.hash = '#budget-analytics'; window.scrollTo({top: 0, behavior: 'auto'}); }}>Budget Tracker</a>
      <a href="#financial-position" className="hover:bg-gray-800 rounded px-3 py-2 transition">Financial Position</a>
      <a href="#mood" className="hover:bg-gray-800 rounded px-3 py-2 transition">Mood Tracker</a>
      <a href="#chat" className="hover:bg-gray-800 rounded px-3 py-2 transition">Ask Chanakya</a>
      <a href="#goal-tracker" className="hover:bg-gray-800 rounded px-3 py-2 transition">Goal Tracker</a>
    </nav>
    <div className="mt-auto text-xs text-gray-400 pt-10">AI Financial Coach</div>
  </aside>
);

export default Sidebar;
