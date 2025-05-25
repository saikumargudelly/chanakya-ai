import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  FiUpload
} from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from './AuthContext';
import QuickMoodPicker from './QuickMoodPicker';
import ChatBox from './ChatBox';
import budgetService from '../services/budgetService';
import { useGoals } from '../context/GoalContext';

// Transaction Item Component
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
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {getCategoryIcon(transaction.category)}
        </div>
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">{transaction.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category} • {transaction.date}</p>
        </div>
      </div>
      <p className={`font-semibold ${transaction.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2
        })}
      </p>
    </div>
  );
};

// Budget Category Component
const BudgetCategory = ({ category, spent, budget, color }) => {
  const percentage = Math.min((spent / budget) * 100, 100);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-300">{category}</span>
        <span className="text-gray-800 dark:text-gray-100 font-medium">
          {spent.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} <span className="text-gray-500">/ {budget.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
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
    enabled: isAuthenticated && !!token,
    staleTime: 0,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Get goals from GoalContext
  const { goals, isLoading: isGoalsLoading, error: goalsError } = useGoals();

  // Determine overall loading state
  const overallLoading = isDashboardLoading || isBudgetLoading || isGoalsLoading;

  if (overallLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Handle combined error states
  if (dashboardError || budgetError || goalsError) {
    return (
      <div className="p-4 text-red-500">
        Error loading data: {dashboardError?.message || budgetError?.message || goalsError?.message}
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
  const { recentTransactions, budgetStatus, moodScore } = dashboardData;

  // Safely calculate percentages for budget status
  const spentVal = typeof budgetStatus?.spent === 'number' ? budgetStatus.spent : 0;
  const totalVal = typeof budgetStatus?.total === 'number' ? budgetStatus.total : 1;
  const spentPercentage = (spentVal / Math.max(totalVal, 1)) * 100 || 0;
  const remainingPercentage = 100 - spentPercentage;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Welcome back, {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'User'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your finances today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Balance */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => navigate('/financial-position')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Balance</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm mt-1 text-green-500 flex items-center">
                <FiTrendingUp className="mr-1" /> 2.5% from last month
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <FiDollarSign className="text-purple-500 text-xl" />
            </div>
          </div>
        </div>

        {/* Monthly Income */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => navigate('/financial-position')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Income</p>
              <p className="text-2xl font-bold text-green-500 dark:text-green-400">
                {budgetData?.income?.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) || '₹0'}
              </p>
              <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                +12% from last month
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <FiDownload className="text-green-500 text-xl" />
            </div>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => navigate('/financial-position')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400">
                {budgetData?.total_expenses?.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) || '₹0'}
              </p>
              <p className="text-sm mt-1 text-red-500 flex items-center">
                <FiTrendingDown className="mr-1" /> 5% from last month
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <FiUpload className="text-red-500 text-xl" />
            </div>
          </div>
        </div>

        {/* Savings Rate */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => navigate('/financial-position')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Savings Rate</p>
              <p className="text-2xl font-bold text-blue-500 dark:text-blue-400">
                {savingsRate}%
              </p>
              <p className="text-sm mt-1 text-blue-500 flex items-center">
                <FiTrendingUp className="mr-1" /> 3.2% from last month
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <FiPieChart className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Restructured Main Content Grid (2x2 Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Left: Goals (Swapped with Recent Transactions) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          {/* Header with Goal Title and Add Button */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Goals</h3>
            <button 
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => navigate('/goal-tracker')}
            >
              + Add Goal
            </button>
          </div>
          {goals && goals.length > 0 ? (
            <div className="space-y-4">
              {/* Map over goals from GoalContext */}
              {goals.map(goal => {
                // Calculate progress here
                const progress = (goal.savedAmount / goal.targetAmount) * 100 || 0;
                return (
                  <div key={goal.id} className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {/* Flex container for Name and Percentage */}
                    <div className="flex justify-between items-center mb-1">
                      {/* Goal Name */}
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{goal.goalName}</div>
                      {/* Percentage */}
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{progress.toFixed(0)}%</div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <p>No goals set yet.</p>
            </div>
          )}
        </div>

        {/* Top Right: Mood Picker and Chat - Merged */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col gap-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Ask Chanakya Anything</h3>
          {/* Mood Picker Options */}
          <QuickMoodPicker />
          {/* Chanakya Chat */}
          <ChatBox />
        </div>

        {/* Bottom Left: Recent Transactions (Swapped with Goals) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Transactions</h2>
            <div className="flex space-x-2">
              <button 
                className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setActiveTab('expenses')}
              >
                Expenses
              </button>
              <button 
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setActiveTab('income')}
              >
                Income
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {recentTransactions?.length > 0 ? (
              recentTransactions.slice(0, 5).map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No recent transactions found.</p>
                <button 
                  onClick={() => navigate('/add-transaction')}
                  className="mt-2 text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Add your first transaction
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => navigate('/transactions')}
            className="mt-4 w-full py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
          >
            View All Transactions <FiArrowRight className="ml-1" />
          </button>
        </div>

        {/* Bottom Right: Placeholder or removed */}
        {/* This spot is now empty or will be filled by other elements expanding */}
        
      </div>
    </div>
  );
};

export default Dashboard;