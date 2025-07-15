import React, { useState, useEffect, useMemo } from 'react';
import { useGoals } from '../../context/GoalContext';
import { useAuth } from '../../context/AuthContext';
import { Player } from '@lottiefiles/react-lottie-player';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import NotificationToast from '../common/NotificationToast';
import { goalService } from '../../services/goals/goalService';

const CHANAKYA_QUOTES = [
  'A person should not be too honest. Straight trees are cut first and honest people are screwed first.',
  'Before you start some work, always ask yourself three questions – Why am I doing it, What the results might be, and Will I be successful. Only when you think deeply and find satisfactory answers to these questions, go ahead.',
  "The world's biggest power is the youth and beauty of a woman.",
  'Education is the best friend. An educated person is respected everywhere. Education beats the beauty and the youth.',
  'There is some self-interest behind every friendship. There is no friendship without self-interests. This is a bitter truth.',
];

const GOAL_TYPES = [
  'Financial',
  'Wellness',
  'Career',
  'Study',
];

const GOAL_CATEGORIES = [
  { label: 'Short-term', value: 'short' },
  { label: 'Mid-term', value: 'mid' },
  { label: 'Long-term', value: 'long' },
];

const MILESTONE_FREQUENCIES = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const TABS = ['Today', 'Week', 'Month', 'Year'];

const getCategoryFromDates = (start, end) => {
  const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
  if (diff <= 7) return 'short';
  if (diff <= 90) return 'mid';
  return 'long';
};

const getRandomQuote = () => CHANAKYA_QUOTES[Math.floor(Math.random() * CHANAKYA_QUOTES.length)];

const getConfidenceColor = (score) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-400';
  return 'bg-red-500';
};

const getConfidenceTooltip = (score) => {
  if (score >= 80) return 'You are on track!';
  if (score >= 50) return 'Some risk: try to update more often or check your milestones.';
  return 'At risk: update your progress, check your milestones, or adjust your plan.';
};

function generateMilestones(goal) {
  console.log('[generateMilestones] Input goal:', goal);
  if (!goal.startDate || !goal.endDate) {
    console.log('[generateMilestones] Missing startDate or endDate, returning empty array');
    return [];
  }
  
  const start = new Date(goal.startDate);
  const end = new Date(goal.endDate);
  const frequency = goal.milestoneFrequency || 'weekly'; // Default to weekly if not specified
  
  console.log('[generateMilestones] Start date:', start, 'End date:', end);
  console.log('[generateMilestones] Frequency:', frequency);
  
  const milestones = [];
  let count = 0;
  
  if (frequency === 'daily') {
    let d = new Date(start);
    while (d <= end) {
      const milestone = {
        id: uuidv4(),
        label: `Day ${++count} (${d.toLocaleDateString()})`,
        completed: false,
        date: new Date(d),
      };
      milestones.push(milestone);
      console.log('[generateMilestones] Added daily milestone:', milestone);
      d.setDate(d.getDate() + 1);
    }
  } else if (frequency === 'weekly') {
    let d = new Date(start);
    while (d <= end) {
      milestones.push({
        id: uuidv4(),
        label: `Week ${++count} (Start: ${d.toLocaleDateString()})`,
        completed: false,
        date: new Date(d),
      });
      d.setDate(d.getDate() + 7);
    }
  } else if (frequency === 'monthly') {
    let d = new Date(start);
    while (d <= end) {
      milestones.push({
        id: uuidv4(),
        label: `Month ${++count} (${d.toLocaleDateString()})`,
        completed: false,
        date: new Date(d),
      });
      d.setMonth(d.getMonth() + 1);
    }
  }
  
  console.log('[generateMilestones] Final milestones array:', milestones);
  return milestones;
}

function calculateProgress(milestones) {
  if (!milestones || milestones.length === 0) return 0;
  const completed = milestones.filter(m => m.completed).length;
  return Math.round((completed / milestones.length) * 100);
}

function calculateConfidence(goal, milestones, updates, mood) {
  if (!Array.isArray(milestones) || milestones.length === 0) return 10;
  let score = 100;
  const now = new Date();
  const end = new Date(goal.endDate);
  const daysLeft = (end - now) / (1000 * 60 * 60 * 24);
  if (daysLeft < 7) score -= 20;
  if (updates < milestones.length / 2) score -= 30;
  if (mood !== undefined && mood < 2) score -= 20;
  if (calculateProgress(milestones) < 50) score -= 20;
  return Math.max(10, Math.min(100, score));
}

const initialGoalState = {
  title: '',
  description: '',
  targetAmount: '',
  startDate: '',
  endDate: '',
  type: 'Financial',
  category: 'short',
  milestoneFrequency: 'weekly',
  milestones: [],
  reminders: [],
  vision: '',
  moodAware: false,
};

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}
function isSameWeek(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const startOfWeek = d => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };
  return startOfWeek(d1).toDateString() === startOfWeek(d2).toDateString();
}
function isSameMonth(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}
function isSameYear(date1, date2) {
  return date1.getFullYear() === date2.getFullYear();
}

export default function SmartGoalTracker() {
  const { goals, fetchGoals } = useGoals();
  const { user } = useAuth();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showVisionBoard, setShowVisionBoard] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [goalForm, setGoalForm] = useState(initialGoalState);
  const [visionImages, setVisionImages] = useState({});
  const [reminder, setReminder] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [toast, setToast] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [mood, setMood] = useState(undefined);
  const [habitNudge, setHabitNudge] = useState('');
  const [rewardBadge, setRewardBadge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editGoalForm, setEditGoalForm] = useState(null);
  const [editReminder, setEditReminder] = useState('');
  const [editReminderTime, setEditReminderTime] = useState('09:00');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [activeTab, setActiveTab] = useState('Today');
  const [confettiGoalId, setConfettiGoalId] = useState(null);
  const [showAllGoals, setShowAllGoals] = useState(false);

  useEffect(() => {
    setMotivationalQuote(getRandomQuote());
  }, [showAddGoal]);

  useEffect(() => {
    if (!goals.length) return;
    const missed = goals.find(g => g.milestones && g.milestones.some(m => !m.completed && new Date(g.endDate) < new Date()));
    if (missed) {
      setHabitNudge('You missed your streak! Want to reschedule or get a motivational boost?');
    } else {
      setHabitNudge('');
    }
  }, [goals]);

  useEffect(() => {
    if (!goals.length) return;
    const consistent = goals.find(g => g.milestones && g.milestones.length > 2 && g.milestones.every(m => m.completed));
    if (consistent) {
      setRewardBadge('🏅 Consistency Star!');
    } else {
      setRewardBadge('');
    }
  }, [goals]);

  useEffect(() => {
    if (showDetailModal && selectedGoal) {
      setEditGoalForm({ ...selectedGoal });
      setEditReminder('');
      setEditReminderTime('09:00');
      setEditLoading(false);
      setEditError(null);
    }
  }, [showDetailModal, selectedGoal]);

  const handleGoalComplete = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
  };

  const handleSaveGoal = async () => {
    setLoading(true);
    setError(null);

    // Only validate targetAmount for Financial goals
    if (goalForm.type === 'Financial' && (!goalForm.targetAmount || isNaN(parseFloat(goalForm.targetAmount)))) {
      setError('Please enter a valid target amount.');
      setLoading(false);
      return;
    }

    try {
      console.log('[handleSaveGoal] Starting with goalForm:', goalForm);
      
      // Ensure we have the required fields for milestone generation
      const goalForMilestones = {
        ...goalForm,
        startDate: goalForm.startDate,
        endDate: goalForm.endDate,
        milestoneFrequency: goalForm.milestoneFrequency || 'weekly'
      };
      
      let milestones = Array.isArray(goalForm.milestones) && goalForm.milestones.length > 0 
        ? goalForm.milestones 
        : generateMilestones(goalForMilestones);
      
      console.log('[handleSaveGoal] Generated milestones:', milestones);
      console.log('[handleSaveGoal] Milestones length:', milestones.length);
      
      const newGoal = {
        ...goalForm,
        id: goalForm.id || undefined,
        milestones: Array.isArray(milestones) ? milestones : [],
        reminders: Array.isArray(goalForm.reminders) ? goalForm.reminders : [],
        category: getCategoryFromDates(goalForm.startDate, goalForm.endDate),
        createdAt: goalForm.createdAt || new Date().toISOString(),
        updates: 0,
      };
      
      console.log('[handleSaveGoal] New goal object before API call:', newGoal);
      console.log('[handleSaveGoal] Milestones in newGoal:', newGoal.milestones);
      
      // Only add targetAmount if Financial
      if (goalForm.type === 'Financial') {
        newGoal.targetAmount = parseFloat(goalForm.targetAmount);
      } else {
        delete newGoal.targetAmount;
      }
      
      console.log('Saving goal payload:', newGoal);
      let savedGoal;
      if (goalForm.id) {
        savedGoal = await goalService.updateGoal(user?.id, newGoal);
      } else {
        savedGoal = await goalService.addGoal(user?.id, newGoal);
      }
      console.log('[handleSaveGoal] Saved goal response:', savedGoal);
      await fetchGoals();
      setShowAddGoal(false);
      setGoalForm(initialGoalState);
      setToast({ type: 'success', message: 'Goal saved successfully!' });
    } catch (error) {
      console.error('[handleSaveGoal] Error:', error);
      setError('Failed to save goal.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await goalService.deleteGoal(user?.id, id);
      await fetchGoals();
      setToast({ type: 'success', message: 'Goal deleted.' });
    } catch (error) {
      setError('Failed to delete goal.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMilestone = (goalId, milestoneId) => {
    setToast({ type: 'info', message: 'Milestone updates are only available from the Vision Board or after backend update.' });
  };

  const handleVisionUpload = (goalId, file) => {
    const url = URL.createObjectURL(file);
    setVisionImages({ ...visionImages, [goalId]: url });
  };

  const getActivityDates = () => {
    let dates = [];
    goals.forEach(goal => {
      goal.milestones?.forEach((m, idx) => {
        if (m.completed) {
          const d = new Date(goal.startDate);
          d.setDate(d.getDate() + idx * 7);
          dates.push(d);
        }
      });
    });
    return dates;
  };

  const getMoodSuggestion = () => {
    if (mood === undefined) return '';
    if (mood < 2) return "Feeling low? Let's simplify this week's target.";
    if (mood > 2) return "You're in a happy mood—time to push a little extra!";
    return '';
  };

  const handleSetReminder = (goalId) => {
    setToast({ type: 'info', message: 'Reminder updates are only available from the Vision Board or after backend update.' });
  };

  const markTodayDone = async (goal) => {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    console.log('[markTodayDone] Milestones before update:', goal.milestones);
    console.log('[markTodayDone] Today:', today);
    const updatedMilestones = (Array.isArray(goal.milestones) ? goal.milestones : []).map(m => {
      // Robust date comparison: match YYYY-MM-DD
      const milestoneDate = m.date ? (typeof m.date === 'string' ? m.date.slice(0, 10) : new Date(m.date).toISOString().slice(0, 10)) : '';
      if (milestoneDate === today) {
        return { ...m, completed: true };
      }
      return m;
    });
    console.log('[markTodayDone] Updated milestones:', updatedMilestones);
    const updatedGoal = { ...goal, milestones: updatedMilestones };
    try {
      await goalService.updateGoal(goal.user_id || goal.userId || user?.id, updatedGoal);
      await fetchGoals();
      console.log('[markTodayDone] Fetched goals after update:', goals);
      setToast({ type: 'success', message: 'Marked today as done!' });
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to mark today as done.' });
    }
  };

  const handleMarkTodayDone = async (goal) => {
    await markTodayDone(goal);
    setConfettiGoalId(goal.id);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1200);
  };

  // Memoized filtering logic to prevent infinite loops
  const filteredGoals = useMemo(() => {
    const today = new Date();
    
    // Debug: Log the raw goals data
    console.log('[FilteredGoals] Raw goals from backend:', goals);
    
    return goals.filter(goal => {
      // Ensure we have the correct data structure
      const goalData = {
        ...goal,
        startDate: goal.startDate || goal.start_date,
        endDate: goal.endDate || goal.end_date,
        milestoneFrequency: goal.milestoneFrequency || goal.milestone_frequency
      };
      
      const milestones = Array.isArray(goalData.milestones) ? goalData.milestones : [];
      
      // Debug logging (only once per filter operation)
      if (goals.length > 0) {
        console.log(`[Filtering] Goal: ${goalData.title}, Type: ${goalData.type}, Frequency: ${goalData.milestoneFrequency}`);
        console.log(`[Filtering] StartDate: ${goalData.startDate}, EndDate: ${goalData.endDate}`);
        console.log(`[Filtering] Milestones count: ${milestones.length}`);
        console.log(`[Filtering] Raw goal object:`, goal);
        console.log(`[Filtering] Processed goalData:`, goalData);
      }
      
      if (showAllGoals) return true;
      
      if (activeTab === 'Today') {
        // Show if any milestone is today, or if daily and today is in range
        const inRange = goalData.startDate && goalData.endDate && 
          new Date(goalData.startDate) <= today && today <= new Date(goalData.endDate);
        
        if (goalData.milestoneFrequency === 'daily' && inRange) {
          return true;
        }
        
        // Check if any milestone is today
        const hasTodayMilestone = milestones.some(m => {
          const d = m.date ? (typeof m.date === 'string' ? new Date(m.date) : m.date) : null;
          return d && isSameDay(d, today);
        });
        
        return hasTodayMilestone;
      } else if (activeTab === 'Week') {
        return milestones.some(m => {
          const d = m.date ? (typeof m.date === 'string' ? new Date(m.date) : m.date) : null;
          return d && isSameWeek(d, today);
        });
      } else if (activeTab === 'Month') {
        return milestones.some(m => {
          const d = m.date ? (typeof m.date === 'string' ? new Date(m.date) : m.date) : null;
          return d && isSameMonth(d, today);
        });
      } else if (activeTab === 'Year') {
        return milestones.some(m => {
          const d = m.date ? (typeof m.date === 'string' ? new Date(m.date) : m.date) : null;
          return d && isSameYear(d, today);
        });
      }
      return true;
    });
  }, [goals, activeTab, showAllGoals]);

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#232526] py-10 relative">
        <div className="glassmorphic w-full max-w-4xl rounded-3xl shadow-2xl px-8 py-6 flex flex-col mb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span role="img" aria-label="target" className="text-3xl">🎯</span>
              <h2 className="text-3xl font-bold text-blue-200 tracking-tight flex items-center gap-2">
                Smart Goal Tracker
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-gradient-to-r from-pink-400 to-blue-400 text-white px-4 py-1 rounded-full text-sm font-semibold shadow animate-pulse">Streak: 5 days 🔥</span>
              <img src={`https://api.dicebear.com/7.x/thumbs/svg?seed=genz`} alt="avatar" className="w-10 h-10 rounded-full border-2 border-blue-400 shadow" />
            </div>
          </div>
          {/* Tab Navigation */}
          <div className="flex gap-3 mb-8">
            {TABS.map(tab => (
              <button
                key={tab}
                className={`px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200
                  ${activeTab === tab
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-white/10 text-blue-700 dark:text-blue-200 hover:bg-white/20'}
                `}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Motivational Quote */}
          {motivationalQuote && (
            <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/60 rounded-xl shadow text-yellow-900 dark:text-yellow-100 text-center">
              <span className="text-lg">{motivationalQuote}</span>
            </div>
          )}
          <AnimatePresence>
            {showConfetti && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
              >
                <Player
                  src="https://assets2.lottiefiles.com/packages/lf20_jbrw3hcz.json"
                  autoplay
                  keepLastFrame
                  style={{ width: 400, height: 400 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showAddGoal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-lg relative">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                    onClick={() => setShowAddGoal(false)}
                  >✕</button>
                  <h3 className="text-xl font-bold mb-4">{goalForm.id ? 'Edit Goal' : 'Add New Goal'}</h3>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleSaveGoal();
                    }}
                    className="space-y-3"
                  >
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                      placeholder="Goal Title"
                      value={goalForm.title}
                      onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                      required
                    />
                    <textarea
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                      placeholder="Description (add emoji or motivation)"
                      value={goalForm.description}
                      onChange={e => setGoalForm({ ...goalForm, description: e.target.value })}
                      required
                    />
                    {goalForm.type === 'Financial' && (
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                        placeholder="Target Amount (optional)"
                        type="number"
                        value={goalForm.targetAmount}
                        onChange={e => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                      />
                    )}
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                        value={goalForm.startDate}
                        onChange={e => setGoalForm({ ...goalForm, startDate: e.target.value })}
                        required
                      />
                      <input
                        type="date"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                        value={goalForm.endDate}
                        onChange={e => setGoalForm({ ...goalForm, endDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                        value={goalForm.type}
                        onChange={e => setGoalForm({ ...goalForm, type: e.target.value })}
                      >
                        {GOAL_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <select
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                        value={goalForm.category}
                        onChange={e => setGoalForm({ ...goalForm, category: e.target.value })}
                      >
                        {GOAL_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      <select
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                        value={goalForm.milestoneFrequency}
                        onChange={e => setGoalForm({ ...goalForm, milestoneFrequency: e.target.value })}
                      >
                        {MILESTONE_FREQUENCIES.map(freq => (
                          <option key={freq.value} value={freq.value}>{freq.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold text-sm">Vision (image)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          if (e.target.files[0]) {
                            setGoalForm({ ...goalForm, vision: e.target.files[0] });
                          }
                        }}
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Save Goal
                      </button>
                      <button
                        type="button"
                        className="flex-1 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600"
                        onClick={() => setShowAddGoal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showVisionBoard && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-2xl relative">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                    onClick={() => setShowVisionBoard(false)}
                  >✕</button>
                  <h3 className="text-xl font-bold mb-4">Vision Board</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {goals.map(goal => (
                      <div key={goal.id} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 flex flex-col items-center shadow">
                        {visionImages[goal.id] ? (
                          <img src={visionImages[goal.id]} alt="vision" className="w-24 h-24 object-cover rounded mb-2" />
                        ) : goal.vision && typeof goal.vision === 'string' ? (
                          <div className="text-center text-sm italic text-gray-600 dark:text-gray-300 mb-2">{goal.vision}</div>
                        ) : (
                          <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded mb-2 flex items-center justify-center text-gray-400">No Image</div>
                        )}
                        <div className="font-semibold text-blue-700 dark:text-blue-300 text-center">{goal.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {habitNudge && (
            <div className="my-4 p-3 bg-pink-100 dark:bg-pink-900/60 rounded-xl text-pink-800 dark:text-pink-100 text-center animate-pulse">
              {habitNudge}
            </div>
          )}
          {rewardBadge && (
            <div className="my-2 flex justify-center">
              <span className="inline-block px-4 py-2 bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 rounded-full font-bold text-lg animate-bounce">{rewardBadge}</span>
            </div>
          )}
          {getMoodSuggestion() && (
            <div className="my-2 p-2 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-800 dark:text-blue-100 text-center">
              {getMoodSuggestion()}
            </div>
          )}
          {toast && (
            <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg text-lg animate-bounce">
                {toast.message}
              </div>
            </div>
          )}
          {loading && <div className="text-center text-lg text-blue-500">Loading...</div>}
          {error && <div className="text-center text-lg text-red-500">{error}</div>}
          <div className="flex justify-end mb-4">
            <button
              className="px-4 py-2 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
              onClick={() => setShowAllGoals(v => !v)}
            >
              {showAllGoals ? 'Back to Tab View' : 'See All Goals'}
            </button>
          </div>
          {showAllGoals ? (
            <div className="grid gap-4 mt-4">
              {goals.length === 0 && (
                <div className="text-center text-gray-400 py-8">No goals yet. Click "+ Add Goal" to get started!</div>
              )}
              {goals.map(goal => {
                const progress = calculateProgress(Array.isArray(goal.milestones) ? goal.milestones : []);
                return (
                  <div key={goal.id} className="bg-white/10 dark:bg-gray-800 rounded-xl shadow p-4 flex items-center justify-between gap-4">
                    <span
                      className="font-bold text-blue-200 text-lg cursor-pointer hover:underline"
                      onClick={() => { setSelectedGoal(goal); setShowDetailModal(true); }}
                    >
                      {goal.title}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-xs text-blue-100 font-semibold">{progress}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-6 mt-6">
              {filteredGoals.length === 0 && !showAddGoal && (
                <div className="text-center text-gray-400 py-8">No goals for this period. Click "+ Add Goal" to get started!</div>
              )}
              {filteredGoals.map(goal => {
                const progress = calculateProgress(Array.isArray(goal.milestones) ? goal.milestones : []);
                const confidence = calculateConfidence(goal, Array.isArray(goal.milestones) ? goal.milestones : [], goal.updates || 0, mood);
                const today = new Date().toISOString().slice(0, 10);
                const milestones = Array.isArray(goal.milestones) ? goal.milestones : [];
                const todayMilestone = milestones.find(m => m.date && (typeof m.date === 'string' ? m.date.slice(0, 10) : new Date(m.date).toISOString().slice(0, 10)) === today);
                const todayMilestoneCompleted = todayMilestone && todayMilestone.completed;
                // Calculate streak
                let streak = 0;
                for (let i = milestones.length - 1; i >= 0; i--) {
                  if (milestones[i].completed) streak++;
                  else break;
                }
                // Get today's reminder time if available
                let reminderTime = '';
                if (goal.reminders && Array.isArray(goal.reminders) && goal.reminders.length > 0) {
                  // If reminders are objects with a time property, use that; else fallback to editReminderTime if available
                  const todayReminder = goal.reminders.find(r => r.date === today || !r.date);
                  reminderTime = todayReminder && todayReminder.time ? todayReminder.time : (goal.reminderTime || '');
                } else if (goal.reminderTime) {
                  reminderTime = goal.reminderTime;
                }
                return (
                  <div key={goal.id} className="glassmorphic flex items-center justify-between p-6 rounded-2xl shadow-xl transition-transform hover:scale-[1.02] border border-blue-900/30 relative overflow-hidden mb-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-4xl shadow-lg">
                        {goal.type === 'Financial' ? '💸' : goal.type === 'Wellness' ? '🧘' : goal.type === 'Career' ? '💼' : '📚'}
                      </div>
                      <div>
                        <div className="font-bold text-xl text-blue-100 mb-1 flex items-center gap-2">
                          {goal.title}
                          {streak > 1 && <span className="ml-2 px-2 py-1 bg-pink-200 text-pink-800 rounded-full text-xs animate-bounce">🔥 {streak} day streak</span>}
                          {progress === 100 && <span className="text-green-400 text-base animate-bounce">✔️</span>}
                        </div>
                        <div className="text-blue-200 text-sm opacity-80">{goal.description}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 min-w-[120px]">
                      {/* Circular Progress */}
                      <div className="relative w-14 h-14 flex items-center justify-center">
                        <svg className="absolute top-0 left-0" width="56" height="56">
                          <circle cx="28" cy="28" r="24" stroke="#334155" strokeWidth="6" fill="none" />
                          <circle
                            cx="28" cy="28" r="24"
                            stroke="#60a5fa"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={2 * Math.PI * 24}
                            strokeDashoffset={2 * Math.PI * 24 * (1 - progress / 100)}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.6s' }}
                          />
                        </svg>
                        <span className="text-lg font-bold text-blue-200 z-10">{progress}%</span>
                      </div>
                      <button
                        className={`mt-2 px-5 py-2 rounded-full font-bold shadow transition text-base neon-glow
                          ${todayMilestoneCompleted ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600 animate-pulse'}`}
                        onClick={() => !todayMilestoneCompleted && handleMarkTodayDone(goal)}
                        disabled={todayMilestoneCompleted}
                      >
                        {todayMilestoneCompleted ? 'Done for Today!' : 'Mark Today Done'}
                      </button>
                      {showConfetti && confettiGoalId === goal.id && (
                        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
                          <span className="text-3xl animate-bounce">🎉</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Detail Modal */}
          {showDetailModal && selectedGoal && editGoalForm && (
            (() => {
              const todayStr = new Date().toISOString().slice(0, 10);
              const isTodayCompleted = !!editGoalForm.milestones.find(m => (typeof m.date === 'string' ? m.date.slice(0, 10) : new Date(m.date).toISOString().slice(0, 10)) === todayStr && m.completed);
              // Progress calculation
              const totalMilestones = Array.isArray(editGoalForm.milestones) ? editGoalForm.milestones.length : 0;
              const completedMilestones = Array.isArray(editGoalForm.milestones) ? editGoalForm.milestones.filter(m => m.completed).length : 0;
              const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

              const handleEditSave = async () => {
                setEditLoading(true);
                setEditError(null);
                try {
                  let milestones = Array.isArray(editGoalForm.milestones) ? editGoalForm.milestones : generateMilestones(editGoalForm);
                  const updatedGoal = {
                    ...editGoalForm,
                    milestones: Array.isArray(milestones) ? milestones : [],
                    reminders: Array.isArray(editGoalForm.reminders) ? editGoalForm.reminders : [],
                    category: getCategoryFromDates(editGoalForm.startDate, editGoalForm.endDate),
                    createdAt: editGoalForm.createdAt || new Date().toISOString(),
                    updates: editGoalForm.updates || 0,
                  };
                  await goalService.updateGoal(selectedGoal.user_id || selectedGoal.userId || user?.id, updatedGoal);
                  await fetchGoals();
                  setShowDetailModal(false);
                  setToast({ type: 'success', message: 'Goal updated successfully!' });
                } catch (error) {
                  setEditError('Failed to update goal.');
                } finally {
                  setEditLoading(false);
                }
              };

              const handleEditDelete = async () => {
                setEditLoading(true);
                setEditError(null);
                try {
                  await goalService.deleteGoal(selectedGoal.user_id || selectedGoal.userId || user?.id, selectedGoal.id);
                  await fetchGoals();
                  setShowDetailModal(false);
                  setToast({ type: 'success', message: 'Goal deleted.' });
                } catch (error) {
                  setEditError('Failed to delete goal.');
                } finally {
                  setEditLoading(false);
                }
              };

              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-5xl min-w-[700px] min-h-[520px] md:min-h-[540px] relative animate-fade-in" style={{ width: '90vw', maxWidth: '900px' }}>
                    <button
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
                      onClick={() => setShowDetailModal(false)}
                    >✕</button>
                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-200">Progress</span>
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-200">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-6 text-blue-800 dark:text-blue-200">Goal Details</h3>
                    <form
                      onSubmit={e => { e.preventDefault(); handleEditSave(); }}
                      className="flex flex-col md:flex-row gap-8"
                    >
                      {/* Left Column: Goal Info & Vision */}
                      <div className="flex-1 flex flex-col gap-4 min-w-[260px]">
                        <input
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-300 text-lg font-semibold"
                          placeholder="Goal Title"
                          value={editGoalForm.title}
                          onChange={e => setEditGoalForm({ ...editGoalForm, title: e.target.value })}
                          required
                        />
                        <textarea
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-300 text-base min-h-[60px]"
                          placeholder="Description (add emoji or motivation)"
                          value={editGoalForm.description}
                          onChange={e => setEditGoalForm({ ...editGoalForm, description: e.target.value })}
                          required
                        />
                        {editGoalForm.type === 'Financial' && (
                          <input
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-300 text-base"
                            placeholder="Target Amount (optional)"
                            type="number"
                            value={editGoalForm.targetAmount}
                            onChange={e => setEditGoalForm({ ...editGoalForm, targetAmount: e.target.value })}
                          />
                        )}
                        <div className="flex gap-2">
                          <input
                            type="date"
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-300"
                            value={editGoalForm.startDate}
                            onChange={e => setEditGoalForm({ ...editGoalForm, startDate: e.target.value })}
                            required
                          />
                          <input
                            type="date"
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-300"
                            value={editGoalForm.endDate}
                            onChange={e => setEditGoalForm({ ...editGoalForm, endDate: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <select
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-300"
                            value={editGoalForm.type}
                            onChange={e => setEditGoalForm({ ...editGoalForm, type: e.target.value })}
                          >
                            {GOAL_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          <select
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-300"
                            value={editGoalForm.category}
                            onChange={e => setEditGoalForm({ ...editGoalForm, category: e.target.value })}
                          >
                            {GOAL_CATEGORIES.map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                          <select
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-300"
                            value={editGoalForm.milestoneFrequency}
                            onChange={e => setEditGoalForm({ ...editGoalForm, milestoneFrequency: e.target.value })}
                          >
                            {MILESTONE_FREQUENCIES.map(freq => (
                              <option key={freq.value} value={freq.value}>{freq.label}</option>
                            ))}
                          </select>
                        </div>
                        {/* Reminders (now directly after goal info) */}
                        <div className="w-full flex flex-col gap-2 justify-between">
                          <label className="block text-xs font-semibold mb-1">Reminders</label>
                          <div className="flex gap-2 w-full">
                            <input
                              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-300"
                              placeholder="e.g. Every Monday at"
                              value={editReminder}
                              onChange={e => setEditReminder(e.target.value)}
                            />
                            <input
                              type="time"
                              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-300"
                              value={editReminderTime}
                              onChange={e => setEditReminderTime(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-700 transition min-w-[110px]" type="button" onClick={() => setToast({ type: 'info', message: 'Reminder set (not yet implemented)!' })}>Set Reminder</button>
                            <button className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-xs hover:bg-green-700 transition min-w-[110px]" type="button" onClick={() => setToast({ type: 'info', message: 'Google Calendar sync (not yet implemented)!' })}>Sync to Google Calendar</button>
                          </div>
                        </div>
                      </div>
                      {/* Right Column: Calendar only */}
                      <div className="flex-1 flex flex-col gap-6 min-w-[340px]">
                        <div className="flex flex-col gap-6 w-full">
                          {/* Milestone Calendar */}
                          <div className="w-full">
                            <label className="block text-xs font-semibold mb-1">Milestone Calendar</label>
                            <DayPicker
                              mode="multiple"
                              selected={Array.isArray(editGoalForm.milestones) ? editGoalForm.milestones.filter(m => m.completed).map(m => m.date) : []}
                              onSelect={dates => {
                                // Mark milestones as completed if their date is in selected dates
                                const updatedMilestones = Array.isArray(editGoalForm.milestones) ? editGoalForm.milestones.map(m => ({
                                  ...m,
                                  completed: dates?.some(d => d && m.date && new Date(d).toDateString() === new Date(m.date).toDateString())
                                })) : [];
                                setEditGoalForm({ ...editGoalForm, milestones: updatedMilestones });
                              }}
                              fromDate={Array.isArray(editGoalForm.milestones) ? editGoalForm.milestones[0]?.date : undefined}
                              toDate={Array.isArray(editGoalForm.milestones) ? editGoalForm.milestones[editGoalForm.milestones.length - 1]?.date : undefined}
                              modifiers={{
                                completed: Array.isArray(editGoalForm.milestones) ? editGoalForm.milestones.filter(m => m.completed).map(m => m.date) : [],
                              }}
                              modifiersClassNames={{
                                completed: 'bg-blue-500 text-white rounded-full',
                              }}
                            />
                          </div>
                          {/* Action Buttons (moved here) */}
                          <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
                            <button
                              type="button"
                              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition"
                              onClick={handleEditSave}
                              disabled={editLoading}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="flex-1 bg-red-500 text-white px-4 py-3 rounded-xl text-lg font-semibold hover:bg-red-700 transition"
                              onClick={handleEditDelete}
                              disabled={editLoading}
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-xl text-lg font-semibold hover:bg-gray-600 transition"
                              onClick={() => setShowDetailModal(false)}
                              disabled={editLoading}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>
      <button
        className="fixed bottom-10 right-10 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl shadow-2xl flex items-center justify-center neon-glow hover:scale-110 transition-all z-50"
        title="Add Goal"
        onClick={() => setShowAddGoal(true)}
      >
        +
      </button>
      <style>{`
        .glassmorphic {
          background: rgba(30, 41, 59, 0.7);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .neon-glow {
          box-shadow: 0 0 16px #60a5fa, 0 0 32px #6366f1;
        }
      `}</style>
    </>
  );
} 