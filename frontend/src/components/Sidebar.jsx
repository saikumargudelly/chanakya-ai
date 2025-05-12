import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => (
  <aside className="h-screen w-56 bg-gray-900 text-white flex flex-col p-4 shadow-lg fixed left-0 top-0 z-10">
    <div className="mb-10 flex items-center gap-2">
      <span className="text-2xl">💡</span>
      <span className="text-xl font-bold tracking-wide">Chanakya</span>
    </div>
    <nav className="flex flex-col gap-4">
      <Link to="/" className="hover:bg-gray-800 rounded px-3 py-2 transition block">Dashboard</Link>
      <Link to="/budget-analytics" className="hover:bg-gray-800 rounded px-3 py-2 transition block">Budget Tracker</Link>
      <Link to="/financial-position" className="hover:bg-gray-800 rounded px-3 py-2 transition block">Financial Position</Link>
      <Link to="/mood" className="hover:bg-gray-800 rounded px-3 py-2 transition block">Mood Tracker</Link>
      <span className="hover:bg-gray-800 rounded px-3 py-2 transition block text-gray-500 cursor-not-allowed">Ask Chanakya</span>
      <Link to="/goal-tracker" className="hover:bg-gray-800 rounded px-3 py-2 transition block">Goal Tracker</Link>
    </nav>
    <div className="mt-auto text-xs text-gray-400 pt-10">AI Financial Coach</div>
  </aside>
);

export default Sidebar;
