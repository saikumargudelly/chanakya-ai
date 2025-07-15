import React, { useState } from 'react';
import { FiSearch, FiBell, FiMenu } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Profile from '../common/Profile';

const TopNav = ({ toggleSidebar, setShowProfile }) => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Menu button */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleSidebar}
            className="md:hidden text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <FiMenu size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chanakya</h1>
        </div>

        {/* Center - Search bar */}
        <div className="hidden md:flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2 w-1/3 border border-gray-200 dark:border-gray-600 focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-200 dark:focus-within:ring-indigo-800 transition-all">
          <FiSearch className="text-gray-500 dark:text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search transactions, budgets..."
            className="bg-transparent border-none focus:outline-none w-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Right side - Icons and Profile */}
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors relative">
            <FiBell size={20} />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
          </button>
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition-opacity" 
            onClick={() => setShowProfile(true)}
          >
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden md:inline text-sm font-medium text-gray-900 dark:text-white">
              {user?.name || 'User'}
            </span>
          </div>
          {user && (
            <button
              className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200"
              onClick={onLogout}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
