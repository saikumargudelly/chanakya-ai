import React, { useState, useEffect, forwardRef } from 'react';
import { NavLink as BaseNavLink, useLocation } from 'react-router-dom';
import { FiHome, FiPieChart, FiDollarSign, FiSmile, FiTarget, FiMessageSquare, FiUser, FiSettings, FiCreditCard, FiLogOut, FiCalendar, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

// Create a forwardRef wrapper for NavLink
const NavLink = forwardRef((props, ref) => (
  <BaseNavLink {...props} ref={ref} />
));

const Sidebar = forwardRef((props, ref) => {
  const location = useLocation();
  const { token } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: <FiHome className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/budget-analytics', icon: <FiPieChart className="w-5 h-5" />, label: 'Budget Tracker' },
    { to: '/financial-position', icon: <FiDollarSign className="w-5 h-5" />, label: 'Financial Position' },
    { to: '/mood', icon: <FiSmile className="w-5 h-5" />, label: 'Mood Tracker' },
    { to: '/goal-tracker', icon: <FiTarget className="w-5 h-5" />, label: 'Goal Tracker' },
    { to: '/ask-chanakya', icon: <FiMessageSquare className="w-5 h-5" />, label: 'Ask Chanakya', disabled: true },
  ];

  return (
    <aside ref={ref} className="fixed top-0 left-0 z-40 h-screen w-64 pt-5 transition-transform bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center px-6 mb-6">
        {/* Placeholder for Logo */}
        <div className="text-2xl font-bold text-teal-500">Chanakya AI</div>
      </div>
      <div className="h-full px-3 pb-4 overflow-y-auto">
        <div className="space-y-2 font-medium">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={!item.disabled ? item.to : '#'}
              className={({ isActive }) => `flex items-center p-3 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-teal-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center">
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
                {item.disabled && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500 bg-opacity-20 text-yellow-400">
                    Soon
                  </span>
                )}
              </div>
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
