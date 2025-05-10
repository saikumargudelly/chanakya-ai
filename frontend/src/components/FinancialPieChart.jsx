import React from 'react';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';

export default function FinancialPieChart({ expenses }) {
  if (!expenses || Object.keys(expenses).length === 0) {
    return <div className="text-gray-400 italic text-center py-8">No expense data to display.</div>;
  }
  const labels = [];
  const data = [];
  const colors = [
    '#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#34d399'
  ];
  Object.entries(expenses).forEach(([key, value]) => {
    if (key !== 'savings' && value && value !== 0) {
      labels.push(key.charAt(0).toUpperCase() + key.slice(1));
      data.push(value);
    }
  });
  if (data.length === 0) {
    return <div className="text-gray-400 italic text-center py-8">No expense data to display.</div>;
  }
  return <Pie data={{ labels, datasets: [{ data, backgroundColor: colors }] }} />;
}
