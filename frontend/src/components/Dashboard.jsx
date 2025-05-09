import React from 'react';
// import { Bar } from 'react-chartjs-2'; // Or use Recharts

const Dashboard = () => {
  // Placeholder for chart data
  // Replace with actual API data
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-3 text-purple-700 dark:text-purple-300 tracking-tight flex items-center gap-2">
        <span>📊</span> Dashboard
      </h2>
      <div className="text-gray-500 dark:text-gray-400 mb-2">Charts and summary coming soon...</div>
      {/*
      <Bar data={...} options={...} />
      */}
    </div>
  );
};

export default Dashboard;
