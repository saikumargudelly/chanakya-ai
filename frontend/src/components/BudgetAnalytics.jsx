import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2'; // Pie import removed as it's not used
import 'chart.js/auto';
import { fetchMoodSessions } from '../services/moodSession';
import { useAuth } from './AuthContext';

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
  const location = useLocation();
  const [period, setPeriod] = useState('3m');
  const [budgets, setBudgets] = useState([]);
  const [loading] = useState(false); // setLoading removed as it's not used

  // Mood trends state
  const { user } = useAuth();
  const user_id = user?.userId ? Number(user.userId) : user?.id ? Number(user.id) : user?.user_id ? Number(user.user_id) : null;
  console.log('BudgetAnalytics mounted. user:', user, 'user_id:', user_id);
  console.log('BudgetAnalytics render. user_id:', user_id, 'location:', location.pathname);

  console.log('--- BudgetAnalytics COMPONENT RENDER ---');

console.log('[DEBUG] Before budget-fetching useEffect. user_id:', user_id, 'location.pathname:', location.pathname);

useEffect(() => {
  if (!user_id) {
    console.warn('[DEBUG] Budget useEffect: user_id not set, skipping fetch.');
    return;
  }
  console.log('[DEBUG] Budget useEffect running. user_id:', user_id, 'location.pathname:', location.pathname);
  async function fetchBudgets() {
    try {
      console.log('[DEBUG] Fetching budgets for user_id:', user_id);
      const res = await axios.get(
        `http://localhost:5001/budget?user_id=${user_id}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );
      console.log('[DEBUG] Fetched budgets:', res.data.budgets);
      setBudgets(res.data.budgets || []);
    } catch (err) {
      console.error('[DEBUG] Error fetching budgets:', err);
      setBudgets([]);
    }
  }
  fetchBudgets();
}, [location.pathname, user_id]);

  const [moodPeriod, setMoodPeriod] = useState('7d');
  const [moodLoading, setMoodLoading] = useState(false);
  const [, setMoodSessions] = useState([]); // moodSessions removed as it's not used
  const [moodTrendData, setMoodTrendData] = useState({ labels: [], datasets: [] });

  // Helper to get period start for mood
  function getMoodPeriodStart(value) {
    const now = new Date();
    if (value === '7d') return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    if (value === '2w') return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
    if (value === '1m') return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    if (value === '3m') return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    if (value === '6m') return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    if (value === '1y') return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Effect to fetch and process mood sessions for graph
  useEffect(() => {
    async function fetchAndSetMoodSessions() {
      if (!user_id) return;
      setMoodLoading(true);
      try {
        const allSessions = await fetchMoodSessions(user_id);
        // Filter by period
        const start = getMoodPeriodStart(moodPeriod);
        const filtered = allSessions.filter(s => new Date(s.timestamp) >= start);
        // Group by day
        const dayMap = {};
        filtered.forEach(s => {
          const d = new Date(s.timestamp);
          const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
          if (!dayMap[key]) dayMap[key] = [];
          dayMap[key].push(s.perma_scores);
        });
        // Compute average perma scores per day
        const days = Object.keys(dayMap).sort();
        const permaPillars = ['Positive Emotion', 'Engagement', 'Relationships', 'Meaning', 'Accomplishment'];
        const datasets = permaPillars.map((pillar, idx) => ({
          label: pillar,
          data: days.map(day => {
            const arr = dayMap[day].map(scores => scores?.[pillar] ?? 0).filter(x => typeof x === 'number');
            return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
          }),
          borderColor: ['#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'][idx],
          backgroundColor: ['#bbf7d0', '#dbeafe', '#fde68a', '#fecaca', '#ddd6fe'][idx],
          tension: 0.3,
          spanGaps: true,
        }));
        setMoodTrendData({ labels: days, datasets });
        setMoodSessions(filtered);
      } catch {
        setMoodTrendData({ labels: [], datasets: [] });
        setMoodSessions([]);
      }
      setMoodLoading(false);
    }
    fetchAndSetMoodSessions();
  }, [user_id, moodPeriod]);

  

  // Filter budgets by selected period
  const periodStart = getPeriodStart(period);
  const filtered = budgets.filter(b => new Date(b.timestamp) >= periodStart);
  console.log('Period start:', periodStart, 'Type:', typeof periodStart, 'Value:', periodStart instanceof Date ? periodStart.toISOString() : periodStart);
  budgets.forEach(b => {
    console.log('Filter check:', b.timestamp, '->', new Date(b.timestamp), '>=', periodStart, '=', new Date(b.timestamp) >= periodStart);
  });
  console.log('Filtered budgets for period', period, ':', filtered);

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

  
  // Sample data for testing
  const sampleLineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Budget',
        data: [3000, 3200, 2800, 3500, 4000, 3800],
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.3,
      },
      {
        label: 'Actual',
        data: [2800, 3000, 2900, 3200, 3800, 3600],
        borderColor: 'rgb(16, 185, 129)',
        tension: 0.3,
      },
    ],
  };

  // Set to true to use sample data for testing
  const useSample = !lineData || lineData.labels.length === 0;
  const displayLineData = useSample ? sampleLineData : lineData;


  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 max-w-6xl mx-auto mt-8 flex flex-col md:flex-row gap-8">
      {/* Left: Analytics Section */}
      <div className="flex-1 min-w-[320px]">
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
              {filtered.length > 0 || useSample ? (
                <Line data={displayLineData} />
              ) : (
                <div className="text-gray-400 italic text-center py-8">No historical budget data available for this period.</div>
              )}
            </div>
          </>
        )}
      </div>
      {/* Right: Mood Trends Section */}
      <div className="flex-1 min-w-[320px] border-l border-gray-200 dark:border-gray-700 pl-8">
        <h2 className="text-xl font-bold mb-4 text-indigo-700 dark:text-indigo-300 flex items-center gap-2"><span>🧘‍♂️</span> Mood Trends</h2>
        <div className="mb-6 flex gap-4 items-center">
          <label className="font-semibold">Period:</label>
          <select
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700"
            value={moodPeriod}
            onChange={e => setMoodPeriod(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="2w">Last 2 Weeks</option>
            <option value="1m">Last 1 Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year</option>
          </select>
        </div>
        {moodLoading ? (
          <div className="text-center text-lg text-indigo-500">Loading mood trends...</div>
        ) : (
          <>
            <div>
              <h3 className="text-lg font-semibold mb-3">PERMA Pillars Over Time</h3>
              {moodTrendData.labels.length > 0 ? (
                <Line data={moodTrendData} />
              ) : (
                <div className="text-gray-400 italic text-center py-8">No mood data available for this period.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}