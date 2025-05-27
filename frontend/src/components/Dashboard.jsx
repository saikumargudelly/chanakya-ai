import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowRight, 
  FiDollarSign, 
  FiTrendingUp, 
  FiTrendingDown,
  FiPieChart,
  FiCreditCard,
  FiCalendar,
  FiShoppingBag,
  FiCoffee,
  FiHome,
  FiPlus,
  FiDownload,
  FiUpload,
  FiTarget,
  FiAward,
  FiTrendingUp as FiTrendingUpIcon,
  FiMessageCircle
} from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from './AuthContext';
import QuickMoodPicker from './QuickMoodPicker';
import ChatBox from './ChatBox';
import budgetService from '../services/budgetService';
import { useGoals } from '../context/GoalContext';

// Modern Card Component with Hover Effects
const ModernCard = ({ children, onClick, className = "" }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all duration-300 ${className}`}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

// Enhanced Transaction Item Component
const TransactionItem = ({ transaction }) => {
  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'shopping':
        return <FiShoppingBag className="text-purple-500" />;
      case 'food':
        return <FiCoffee className="text-yellow-500" />;
      case 'housing':
        return <FiHome className="text-blue-500" />;
      default:
        return <FiCreditCard className="text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
    >
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg transform hover:scale-110 transition-transform duration-300">
          {getCategoryIcon(transaction.category)}
        </div>
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">{transaction.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category} • {transaction.date}</p>
        </div>
      </div>
      <motion.p
        whileHover={{ scale: 1.1 }}
        className={`font-semibold ${transaction.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}
      >
        {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2
        })}
      </motion.p>
    </motion.div>
  );
};

// Enhanced Budget Category Component
const BudgetCategory = ({ category, spent, budget, color }) => {
  const percentage = Math.min((spent / budget) * 100, 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-4"
    >
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600 dark:text-gray-300 font-medium">{category}</span>
        <span className="text-gray-800 dark:text-gray-100 font-medium">
          {spent.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} 
          <span className="text-gray-500">/ {budget.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </motion.div>
  );
};

// Progress Ring Component for Goals
const ProgressRing = ({ progress, size = 60, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-blue-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-800 dark:text-white">{progress}%</span>
      </div>
    </div>
  );
};

// Add this new component for the mood indicator
const MoodIndicator = ({ score, timestamp, permaData, isToday }) => {
  const getMoodColor = (score) => {
    if (score >= 8) return 'from-green-500 to-emerald-500';
    if (score >= 6) return 'from-blue-500 to-indigo-500';
    if (score >= 4) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getMoodDetails = (score) => {
    // Score is now on a 0-2 scale
    if (score >= 1.8) return { emoji: '😊', label: 'Excellent', color: 'text-green-500' };
    if (score >= 1.5) return { emoji: '🙂', label: 'Good', color: 'text-blue-500' };
    if (score >= 1.2) return { emoji: '😐', label: 'Neutral', color: 'text-yellow-500' };
    if (score >= 0.8) return { emoji: '😕', label: 'Low', color: 'text-orange-500' };
    return { emoji: '😟', label: 'Critical', color: 'text-red-500' };
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return isToday ? 'Today' : 'Yesterday';
  };

  const moodDetails = getMoodDetails(score);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-br p-6 shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${getMoodColor(score).split(' ')[0].replace('from-', '')} 0%, ${getMoodColor(score).split(' ')[1].replace('to-', '')} 100%)`
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">
            Current Mood {timestamp && (
              <span className={`text-xs ${!isToday ? 'bg-white/20 px-2 py-0.5 rounded-full' : ''}`}>
                ({formatDate(timestamp)})
              </span>
            )}
          </p>
          <p className="mt-1 text-2xl font-bold text-white">
            {moodDetails.label}
          </p>
          <p className="text-sm text-white/80">
            {moodDetails.description}
          </p>
        </div>
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="text-4xl"
        >
          {moodDetails.emoji}
        </motion.div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-sm text-white/80 mb-1">
          <span>PERMA Score</span>
          <span>{score}/10</span>
        </div>
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score * 10}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-white/40"
          />
        </div>
        {permaData && (
          <div className="mt-2 grid grid-cols-5 gap-1 text-xs text-white/80">
            <div className="text-center">
              <div>P</div>
              <div>{Math.round((permaData['Positive Emotion'] || 0) * 2)}</div>
            </div>
            <div className="text-center">
              <div>E</div>
              <div>{Math.round((permaData.Engagement || 0) * 2)}</div>
            </div>
            <div className="text-center">
              <div>R</div>
              <div>{Math.round((permaData.Relationships || 0) * 2)}</div>
            </div>
            <div className="text-center">
              <div>M</div>
              <div>{Math.round((permaData.Meaning || 0) * 2)}</div>
            </div>
            <div className="text-center">
              <div>A</div>
              <div>{Math.round((permaData.Accomplishment || 0) * 2)}</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Modal component for ChatBox
const ChatModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
          onClick={onClose} // Close modal when clicking overlay
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white dark:bg-gray-800 shadow-xl overflow-y-auto w-full md:w-1/2 lg:w-1/3 h-full"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Ask Chanakya</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <FiPlus className="transform rotate-45 text-2xl" />
              </button>
            </div>
            <div className="p-4 flex flex-col h-[calc(100vh-72px)]">
              {/* Quick Mood Picker inside the chat modal */}
              <div className="mb-4">
                <QuickMoodPicker />
              </div>
              {/* ChatBox fills the rest of the space */}
              <div className="flex-grow overflow-y-auto">
                <ChatBox />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isChatOpen, setIsChatOpen] = useState(false); // State to manage chat modal visibility
  
  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 18) {
      return 'Good noon';
    } else {
      return 'Good evening';
    }
  };

  const greeting = getTimeBasedGreeting();
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
    enabled: !isAuthLoading && isAuthenticated && !!token, // Wait for auth to load
    // Initial data to prevent errors if API is not ready
    initialData: {
      monthlyBudget: { 
        income: 0, 
        expenses: {},
        total_expenses: 0,
        savings: 0,
        balance: 0,
        savingsRate: 0
      },
      recentTransactions: [],
      budgetStatus: { 
        remaining: 0, 
        spent: 0, 
        total: 0,
        categories: [
          { name: 'Groceries', spent: 0, budget: 0 },
          { name: 'Shopping', spent: 0, budget: 0 },
          { name: 'Bills', spent: 0, budget: 0 },
          { name: 'Entertainment', spent: 0, budget: 0 },
        ]
      },
      moodScore: 0,
      goals: []
    },
    // Mock data for development
    placeholderData: {
      monthlyBudget: { 
        income: 4850, 
        expenses: {
          rent: 1200, food: 600, transport: 200, utilities: 150, entertainment: 300, other: 250, savings: 500
        },
        total_expenses: 2700,
        savings: 2150,
        balance: 12450,
        savingsRate: 44
      },
      recentTransactions: [
        { id: 1, description: 'Grocery Store', category: 'Shopping', amount: -125.75, date: 'Today' },
        { id: 2, description: 'Monthly Salary', category: 'Income', amount: 4850.00, date: 'Today' },
        { id: 3, description: 'Electric Bill', category: 'Bills', amount: -85.20, date: 'Yesterday' },
        { id: 4, description: 'Coffee Shop', category: 'Food', amount: -4.50, date: 'Yesterday' },
        { id: 5, description: 'Bookstore', category: 'Shopping', amount: -32.99, date: '2 days ago' },
      ],
      budgetStatus: { 
        remaining: 800, 
        spent: 2400, 
        total: 3200,
        categories: [
          { name: 'Groceries', spent: 520, budget: 800 },
          { name: 'Shopping', spent: 780, budget: 1000 },
          { name: 'Bills', spent: 650, budget: 800 },
          { name: 'Entertainment', spent: 450, budget: 600 },
        ]
      },
      moodScore: 8,
      goals: [
        { id: 1, name: 'Emergency Fund', current: 3500, target: 10000, progress: 35 },
        { id: 2, name: 'New Laptop', current: 800, target: 2000, progress: 40 },
      ]
    }
  });

  // New query to fetch current month budget data directly
  const { data: currentBudget, isLoading: isBudgetLoading, error: budgetError } = useQuery({
    queryKey: ['currentMonthBudget', token],
    queryFn: () => budgetService.getCurrentMonthBudget(token),
    enabled: !isAuthLoading && isAuthenticated && !!token, // Wait for auth to load
    staleTime: 0,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Get goals from GoalContext (assuming it handles its own loading based on auth)
  const { goals, isLoading: isGoalsLoading, error: goalsError } = useGoals();

  // Add debug log for goals
  console.log('Goals data from GoalContext:', goals);

  // Fetch mood data
  const { data: moodData, isLoading: isMoodLoading } = useQuery({
    queryKey: ['moodData'],
    queryFn: async () => {
      const response = await api.get('/mood-session');
      console.log('Mood data from API:', response.data); // Debug log
      return response.data;
    },
    enabled: !isAuthLoading && isAuthenticated && !!token, // Wait for auth to load
  });

  // Process mood data to get current mood
  const getCurrentMood = () => {
    if (!moodData || !moodData.length) {
      console.log('No mood data available'); // Debug log
      return null;
    }

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort mood entries by timestamp in descending order (newest first)
    const sortedMoods = [...moodData].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    console.log('Sorted mood entries:', sortedMoods); // Debug log

    // Find today's mood entry
    const todayMood = sortedMoods.find(entry => {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      const isToday = entryDate.getTime() === today.getTime();
      console.log('Checking entry:', entry.timestamp, 'Is today?', isToday); // Debug log
      return isToday;
    });

    if (todayMood) {
      console.log('Found today\'s mood:', todayMood); // Debug log
      return { ...todayMood, isToday: true };
    }

    // If no today's entry, find yesterday's
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayMood = sortedMoods.find(entry => {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      const isYesterday = entryDate.getTime() === yesterday.getTime();
      console.log('Checking entry:', entry.timestamp, 'Is yesterday?', isYesterday); // Debug log
      return isYesterday;
    });

    if (yesterdayMood) {
      console.log('Found yesterday\'s mood:', yesterdayMood); // Debug log
      return { ...yesterdayMood, isToday: false };
    }

    console.log('No recent mood entries found'); // Debug log
    return null;
  };

  // Calculate PERMA score
  const calculatePermaScore = (moodEntry) => {
    if (!moodEntry || !moodEntry.perma_scores) {
      console.log('Invalid mood entry for score calculation:', moodEntry);
      return 0;
    }

    // Get individual PERMA component scores (0-2 scale)
    const positiveEmotion = moodEntry.perma_scores['Positive Emotion'] || 0;
    const engagement = moodEntry.perma_scores.Engagement || 0;
    const relationships = moodEntry.perma_scores.Relationships || 0;
    const meaning = moodEntry.perma_scores.Meaning || 0;
    const accomplishment = moodEntry.perma_scores.Accomplishment || 0;
    
    // Calculate average of PERMA components (0-2 scale)
    const permaScore = (
      positiveEmotion +
      engagement +
      relationships +
      meaning +
      accomplishment
    ) / 5;

    // Scale to 0-10 range (multiply by 5 since we're going from 0-2 to 0-10)
    const scaledScore = Math.round(permaScore * 5);
    console.log('Calculated PERMA score:', scaledScore, 'from components:', moodEntry.perma_scores);
    return scaledScore;
  };

  // Get current mood entry and calculate score
  const currentMoodEntry = getCurrentMood();
  const currentPermaScore = currentMoodEntry ? calculatePermaScore(currentMoodEntry) : 0;

  // Determine overall loading state
  const overallLoading = isDashboardLoading || isBudgetLoading || isGoalsLoading || isMoodLoading || isAuthLoading; // Include auth loading

  // Handle combined error states
  if (dashboardError || budgetError || goalsError) {
    return (
      <div className="p-4 text-red-500">
        Error loading data: {dashboardError?.message || budgetError?.message || goalsError?.message}
      </div>
    );
  }

  if (overallLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Use currentBudget for quick stats, fallback to dashboardData if currentBudget is null/undefined
  const budgetData = currentBudget || dashboardData?.monthlyBudget;

  // Compute balance using currentBudget (income - total_expenses)
  const balance = budgetData?.income - (budgetData?.total_expenses || 0) || 0;

  // Calculate Savings Rate using currentBudget
  const savingsRate = (budgetData?.income > 0 ? ((budgetData.savings / budgetData.income) * 100) : 0).toFixed(0);

  // Destructure other data from dashboardData (transactions, budgetStatus)
  const { recentTransactions, budgetStatus } = dashboardData;

  // Safely calculate percentages for budget status
  const spentVal = typeof budgetStatus?.spent === 'number' ? budgetStatus.spent : 0;
  const totalVal = typeof budgetStatus?.total === 'number' ? budgetStatus.total : 1;
  const spentPercentage = (spentVal / Math.max(totalVal, 1)) * 100 || 0;
  const remainingPercentage = 100 - spentPercentage;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="p-6 max-w-7xl mx-auto"
    >
      {/* Welcome Section with Animation and Chat Button */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {greeting}! Here's your financial snapshot for today
          </p>
        </div>
        {/* Fixed Animated Chat Button */}
        <motion.button
          onClick={() => setIsChatOpen(true)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          aria-label="Open Chanakya Chat"
        >
          <FiMessageCircle className="text-2xl" />
        </motion.button>
      </motion.div>

      {/* Quick Stats with Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {overallLoading ? (
          // Loading skeleton for quick stats
          Array(5).fill(0).map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          ))
        ) : (
          <>
            <ModernCard onClick={() => navigate('/financial-position')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm mt-1 text-green-500 flex items-center">
                    <FiTrendingUpIcon className="mr-1" /> +2.5% from last month
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FiDollarSign className="text-blue-500 text-xl" />
                </div>
              </div>
            </ModernCard>

            <ModernCard onClick={() => navigate('/budget-analytics')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Income</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {(budgetData?.income || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm mt-1 text-green-500 flex items-center">
                    <FiTrendingUpIcon className="mr-1" /> +5.2% from last month
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FiUpload className="text-green-500 text-xl" />
                </div>
              </div>
            </ModernCard>

            <ModernCard onClick={() => navigate('/budget-analytics')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {(budgetData?.total_expenses || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm mt-1 text-red-500 flex items-center">
                    <FiTrendingDown className="mr-1" /> +1.8% from last month
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <FiDownload className="text-red-500 text-xl" />
                </div>
              </div>
            </ModernCard>

            <ModernCard onClick={() => navigate('/budget-analytics')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Savings Rate</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {savingsRate}%
                  </p>
                  <p className="text-sm mt-1 text-green-500 flex items-center">
                    <FiTrendingUpIcon className="mr-1" /> +3.1% from last month
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FiTarget className="text-purple-500 text-xl" />
                </div>
              </div>
            </ModernCard>

            <MoodIndicator 
              score={currentPermaScore} 
              timestamp={currentMoodEntry?.timestamp}
              permaData={currentMoodEntry?.perma_scores}
              isToday={currentMoodEntry?.isToday}
            />
          </>
        )}
      </div>

      {/* Goals Section with Progress Rings */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Your Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(goals || []).map((goal) => {
            // Calculate progress percentage
            const progress = goal.targetAmount > 0 
              ? Math.round((goal.savedAmount / goal.targetAmount) * 100) 
              : 0;

            return (
              <ModernCard key={goal.id}>
                <div className="flex items-center space-x-4">
                  {/* Use calculated progress */} 
                  <ProgressRing progress={progress} /> 
                  <div>
                    {/* Use goalName property */} 
                    <h3 className="font-semibold text-gray-800 dark:text-white">{goal.goalName || 'Unnamed Goal'}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {/* Use savedAmount and targetAmount properties */} 
                      {(goal.savedAmount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} / {(goal.targetAmount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </p>
                  </div>
                </div>
              </ModernCard>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions with Enhanced UI */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recent Transactions</h2>
          <button
            onClick={() => navigate('/transactions')}
            className="text-blue-500 hover:text-blue-600 flex items-center space-x-1"
          >
            <span>View All</span>
            <FiArrowRight />
          </button>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {(recentTransactions || []).map((transaction) => (
              <TransactionItem 
                key={transaction.id} 
                transaction={{
                  ...transaction,
                  amount: transaction.amount || 0,
                  description: transaction.description || 'Unknown Transaction',
                  category: transaction.category || 'Uncategorized',
                  date: transaction.date || 'Unknown Date'
                }} 
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Budget Status with Enhanced Progress Bars */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Budget Status</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          {(budgetStatus?.categories || []).map((category, index) => (
            <BudgetCategory
              key={index}
              category={category.name || 'Unnamed Category'}
              spent={category.spent || 0}
              budget={category.budget || 0}
              color={`bg-${['blue', 'green', 'purple', 'yellow'][index % 4]}-500`}
            />
          ))}
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

    </motion.div>
  );
};

export default Dashboard;