import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function UserDropdown({ onProfileClick }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return (
    <div className="relative inline-block text-left">
      <button
        className="flex items-center gap-2 px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white font-semibold"
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="truncate max-w-[120px]">{user.username || 'User'}</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50">
          <button className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onProfileClick}>Profile</button>
          <button className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800" onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  );
}
