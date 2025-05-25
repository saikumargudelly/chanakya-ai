import React, { useState, useEffect, forwardRef } from 'react';
import { NavLink as BaseNavLink, useLocation } from 'react-router-dom';
import { FiHome, FiPieChart, FiDollarSign, FiSmile, FiTarget, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from './AuthContext'; // Added missing import

// Create a forwardRef wrapper for NavLink
const NavLink = forwardRef((props, ref) => (
  <BaseNavLink {...props} ref={ref} />
));

const Sidebar = () => {
  const location = useLocation();
  const { token } = useAuth();

  const navItems = [
    { to: '/', icon: <FiHome className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/budget-analytics', icon: <FiPieChart className="w-5 h-5" />, label: 'Budget Tracker' },
    { to: '/financial-position', icon: <FiDollarSign className="w-5 h-5" />, label: 'Financial Position' },
    { to: '/mood', icon: <FiSmile className="w-5 h-5" />, label: 'Mood Tracker' },
    { to: '/goal-tracker', icon: <FiTarget className="w-5 h-5" />, label: 'Goal Tracker' },
    { to: '/ask-chanakya', icon: <FiMessageSquare className="w-5 h-5" />, label: 'Ask Chanakya', disabled: true },
  ];

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-64 pt-20 transition-transform -translate-x-full bg-gray-800 border-r border-gray-700 sm:translate-x-0">
      <div className="h-full px-3 pb-4 overflow-y-auto bg-gray-800">
        <div className="space-y-2 font-medium">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={!item.disabled ? item.to : '#'}
              className={`flex items-center p-3 rounded-lg group ${
                location.pathname === item.to
                  ? 'text-white bg-gray-700'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
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
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-gray-500 border-t border-gray-700">
        <p>AI Financial Coach</p>
        <p className="mt-1 text-gray-600">v1.0.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
