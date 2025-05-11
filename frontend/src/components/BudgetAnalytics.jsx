import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie, Line } from 'react-chartjs-2';
import 'chart.js/auto';

const PERIODS = [
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
  { label: '3 Years', value: '3y' }
];

function getPeriodStart(value) {
  const now = new Date();
  if (value === '3m') return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (value === '6m') return new Date(now.getFullYear(), now.getMonth() - 5, 1);
  if (value === '1y') return new Date(now.getFullYear() - 1, now.getMonth(), 1);
  if (value === '3y') return new Date(now.getFullYear() - 3, now.getMonth(), 1);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default function BudgetAnalytics() {
  const [period, setPeriod] = useState('3m');
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBudgets() {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5001/budget', { params: { user_id: 1 } });
        setBudgets(res.data.budgets || []);
      } catch {
        setBudgets([]);
      }
      setLoading(false);
    }
    fetchBudgets();
    // Listen for hash changes to reload data when navigating
    const onHashChange = () => {
      if (window.location.hash === '#budget-analytics') {
        fetchBudgets();
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Filter budgets by selected period
  const periodStart = getPeriodStart(period);
  const filtered = budgets.filter(b => new Date(b.timestamp) >= periodStart);

  // Pie chart data (current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthBudgets = budgets.filter(b => {
    const d = new Date(b.timestamp);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const pieData = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#34d399'
        ]
      }
    ]
  };
  let hasPieData = false;
  if (monthBudgets.length) {
    const last = monthBudgets[monthBudgets.length - 1];
    Object.entries(last.expenses).forEach(([key, value]) => {
      if (value && value !== 0) {
        pieData.labels.push(key.charAt(0).toUpperCase() + key.slice(1));
        pieData.datasets[0].data.push(value);
      }
    });
    hasPieData = pieData.datasets[0].data.length > 0;
  }

  // Line chart data (income, expenses, savings)
  const lineLabels = filtered.map(b => new Date(b.timestamp).toLocaleDateString());
  const incomeData = filtered.map(b => b.income);
  const expensesData = filtered.map(b => Object.entries(b.expenses || {}).filter(([k]) => k !== 'savings').reduce((sum, [k, v]) => sum + v, 0));
  const savingsData = filtered.map(b => b.expenses && b.expenses.savings ? b.expenses.savings : 0);
  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#4ade80',
        backgroundColor: '#bbf7d0',
        tension: 0.3
      },
      {
        label: 'Expenses',
        data: expensesData,
        borderColor: '#f87171',
        backgroundColor: '#fecaca',
        tension: 0.3
      },
      {
        label: 'Savings',
        data: savingsData,
        borderColor: '#60a5fa',
        backgroundColor: '#dbeafe',
        tension: 0.3
      }
    ]
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Budget Analytics</h2>
      <div className="mb-6 flex gap-4 items-center">
        <label className="font-semibold">Period:</label>
        <select
          className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700"
          value={period}
          onChange={e => setPeriod(e.target.value)}
        >
          {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="text-center text-lg text-blue-500">Loading analytics...</div>
      ) : (
        <>
          <div>
            <h3 className="text-lg font-semibold mb-3">Trends Over Time</h3>
            {filtered.length > 0 ? (
              <Line data={lineData} />
            ) : (
              <div className="text-gray-400 italic text-center py-8">No historical budget data available for this period.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
