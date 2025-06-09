import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function UserDropdown({ onProfileClick }) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  if (!user) return null;
  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-3 focus:outline-none"
      >
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-semibold">
          {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
        </div>
        <span className="hidden md:block text-gray-700 dark:text-gray-200">
          {user?.first_name} {user?.last_name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
          <button
            onClick={() => {
              onProfileClick();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Profile Settings
          </button>
          <button
            onClick={logout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
