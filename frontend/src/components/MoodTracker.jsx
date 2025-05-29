import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getPermaTipConversation } from '../services/permaChat';
import { fetchMoodSessions, saveMoodSession, fetchRecentMoodSessions, checkDailySessionCount } from '../services/moodSession';
import { useAuth } from './AuthContext';
import ChatBubble from './ChatBubble';
import QuickReplies from './QuickReplies';

// Enhanced PERMA questions with more depth and variety
const ALL_PERMA_QUESTIONS = [
  // Core PERMA questions with more nuanced options
  {
    pillar: 'Positive Emotion',
    question: 'What best describes your emotional landscape today?',
    options: [
      { label: '🌞 Mostly positive and uplifting', value: 2 },
      { label: '🌤️ Generally good with some ups and downs', value: 1.5 },
      { label: '🌥️ Neutral - neither particularly good nor bad', value: 1 },
      { label: '🌧️ More challenging than usual', value: 0.5 },
      { label: '🌪️ Really difficult day', value: 0 },
    ],
    followUp: {
      question: 'What contributed most to how you\'re feeling right now?',
      type: 'text',
      optional: true
    }
  },
  {
    pillar: 'Engagement',
    question: 'How absorbed were you in your activities today?',
    options: [
      { label: '🎯 Completely in the zone', value: 2 },
      { label: '🎨 Had some moments of deep focus', value: 1.5 },
      { label: '🤹‍♂️ Some focus, some distractions', value: 1 },
      { label: '🔄 Mostly going through the motions', value: 0.5 },
      { label: '😕 Hard to stay focused today', value: 0 },
    ],
    followUp: {
      question: 'What activity captured your attention the most today?',
      type: 'text',
      optional: true
    }
  },
  {
    pillar: 'Relationships',
    question: 'How connected did you feel to others today?',
    options: [
      { label: '💞 Deeply connected and supported', value: 2 },
      { label: '🤝 Some good interactions', value: 1.5 },
      { label: '👥 A few brief connections', value: 1 },
      { label: '🌌 Felt a bit distant from others', value: 0.5 },
      { label: '🏝️ Pretty isolated today', value: 0 },
    ],
    followUp: {
      question: 'Who or what made you feel most connected today?',
      type: 'text',
      optional: true
    }
  },
  {
    pillar: 'Meaning',
    question: 'How meaningful did today feel?',
    options: [
      { label: '🌟 Deeply purposeful and significant', value: 2 },
      { label: '✨ Some meaningful moments', value: 1.5 },
      { label: '🔍 Still searching for meaning today', value: 1 },
      { label: '🌫️ Felt a bit aimless', value: 0.5 },
      { label: '❓ Hard to find meaning today', value: 0 },
    ],
    followUp: {
      question: 'What gave you a sense of purpose today?',
      type: 'text',
      optional: true
    }
  },
  {
    pillar: 'Accomplishment',
    question: 'How do you feel about what you accomplished today?',
    options: [
      { label: '🏆 Exceeded my expectations', value: 2 },
      { label: '✅ Made solid progress', value: 1.5 },
      { label: '🔄 Did what I needed to do', value: 1 },
      { label: '⏳ Could have done more', value: 0.5 },
      { label: '😕 Not my most productive day', value: 0 },
    ],
    followUp: {
      question: 'What are you most proud of accomplishing today?',
      type: 'text',
      optional: true
    }
  },
  // Additional contextual questions
  {
    pillar: 'Positive Emotion',
    question: 'What was your energy level like today?',
    options: [
      { label: '⚡ Full of energy and vitality', value: 2 },
      { label: '🔋 Pretty good overall', value: 1.5 },
      { label: '🔌 Average energy', value: 1 },
      { label: '🪫 Running a bit low', value: 0.5 },
      { label: '😴 Completely drained', value: 0 },
    ]
  },
  {
    pillar: 'Engagement',
    question: 'How present were you in your activities today?',
    options: [
      { label: '🧘‍♂️ Completely in the moment', value: 2 },
      { label: '👀 Mostly present', value: 1.5 },
      { label: '🤔 Somewhat distracted', value: 1 },
      { label: '📱 Mind wandering a lot', value: 0.5 },
      { label: '🌪️ Very scattered', value: 0 },
    ]
  },
  {
    pillar: 'Relationships',
    question: 'How supported did you feel today?',
    options: [
      { label: '🤗 Completely supported', value: 2 },
      { label: '💪 Pretty well supported', value: 1.5 },
      { label: '🤝 Adequately supported', value: 1 },
      { label: '🫂 Could use more support', value: 0.5 },
      { label: '🏝️ Felt quite alone', value: 0 },
    ]
  },
  {
    pillar: 'Meaning',
    question: 'How aligned did your day feel with your values?',
    options: [
      { label: '🎯 Perfect alignment', value: 2 },
      { label: '🧭 Mostly aligned', value: 1.5 },
      { label: '🔄 Some alignment', value: 1 },
      { label: '🔄 Some misalignment', value: 0.5 },
      { label: '❌ Not aligned at all', value: 0 },
    ]
  },
  {
    pillar: 'Accomplishment',
    question: 'How in control of your time did you feel today?',
    options: [
      { label: '⏱️ Completely in control', value: 2 },
      { label: '📊 Mostly managed well', value: 1.5 },
      { label: '🔄 Somewhat balanced', value: 1 },
      { label: '🎢 A bit chaotic', value: 0.5 },
      { label: '🌪️ Completely overwhelmed', value: 0 },
    ]
  },
  // More specific situational questions
  {
    pillar: 'Positive Emotion',
    question: 'Did you experience any moments of joy or gratitude today?',
    options: [
      { label: '😊 Many beautiful moments', value: 2 },
      { label: '🙂 A few nice moments', value: 1.5 },
      { label: '😐 Just small things', value: 1 },
      { label: '🤔 Hard to think of any', value: 0.5 },
      { label: '😕 Nothing comes to mind', value: 0 },
    ],
    followUp: {
      question: 'What was one thing you were grateful for today?',
      type: 'text',
      optional: true
    }
  },
  {
    pillar: 'Engagement',
    question: 'How challenging were your activities today?',
    options: [
      { label: '🧠 Perfectly challenging', value: 2 },
      { label: '⚖️ Good balance', value: 1.5 },
      { label: '🔄 Mixed difficulty', value: 1 },
      { label: '😴 Too easy', value: 0.5 },
      { label: '😫 Overwhelmingly hard', value: 0 },
    ]
  },
  {
    pillar: 'Relationships',
    question: 'How well did you communicate your needs today?',
    options: [
      { label: '💬 Clearly and effectively', value: 2 },
      { label: '🗣️ Pretty well overall', value: 1.5 },
      { label: '🤐 Could have been better', value: 1 },
      { label: '😶 Struggled to speak up', value: 0.5 },
      { label: '🙊 Didn\'t express myself', value: 0 },
    ]
  },
  {
    pillar: 'Meaning',
    question: 'How connected do you feel to something larger than yourself?',
    options: [
      { label: '🌌 Deeply connected', value: 2 },
      { label: '🌠 Somewhat connected', value: 1.5 },
      { label: '🔍 Occasionally felt it', value: 1 },
      { label: '🌫️ Felt distant', value: 0.5 },
      { label: '🏝️ Completely disconnected', value: 0 },
    ]
  },
  {
    pillar: 'Accomplishment',
    question: 'How satisfied are you with what you got done today?',
    options: [
      { label: '😊 Extremely satisfied', value: 2 },
      { label: '🙂 Pretty good', value: 1.5 },
      { label: '😐 Neutral', value: 1 },
      { label: '😕 Somewhat disappointed', value: 0.5 },
      { label: '😞 Very disappointed', value: 0 },
    ]
  }
];

// Helper to get a deterministic daily set of questions (5-6 questions per day)
function getTodaysQuestions(questionPool) {
  // Use date as a seed for deterministic shuffle
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Group questions by pillar
  const questionsByPillar = {};
  questionPool.forEach(q => {
    if (!questionsByPillar[q.pillar]) {
      questionsByPillar[q.pillar] = [];
    }
    questionsByPillar[q.pillar].push(q);
  });

  // Select 1 question from each pillar
  let selectedQuestions = [];
  Object.keys(questionsByPillar).forEach(pillar => {
    const pillarQuestions = [...questionsByPillar[pillar]];
    // Simple seeded shuffle for this pillar's questions
    for (let i = pillarQuestions.length - 1; i > 0; i--) {
      const j = (seed + i * 31) % (i + 1);
      [pillarQuestions[i], pillarQuestions[j]] = [pillarQuestions[j], pillarQuestions[i]];
    }
    selectedQuestions.push(pillarQuestions[0]);
  });

  // Add 1-2 additional random questions for variety
  const remainingQuestions = questionPool.filter(q => !selectedQuestions.includes(q));
  const numExtra = 1 + (seed % 2); // 1 or 2 extra questions
  
  for (let i = 0; i < numExtra && remainingQuestions.length > 0; i++) {
    const randomIndex = (seed * (i + 1)) % remainingQuestions.length;
    selectedQuestions.push(remainingQuestions[randomIndex]);
    remainingQuestions.splice(randomIndex, 1);
  }

  // Final shuffle of selected questions
  for (let i = selectedQuestions.length - 1; i > 0; i--) {
    const j = (seed + i * 31) % (i + 1);
    [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
  }

  return selectedQuestions;
}

const PERMA_PILLARS = ['Positive Emotion', 'Engagement', 'Relationships', 'Meaning', 'Accomplishment'];

// Expanded set of PERMA questions (total 25 questions)
const PERMA_QUESTIONS = [
  // Positive Emotion (5 questions)
  {
    pillar: 'Positive Emotion',
    question: 'What best describes your emotional landscape today?',
    options: [
      { label: '🌞 Mostly positive and uplifting', value: 2 },
      { label: '🌤️ Generally good with some ups and downs', value: 1.5 },
      { label: '🌥️ Neutral - neither particularly good nor bad', value: 1 },
      { label: '🌧️ More challenging than usual', value: 0.5 },
      { label: '🌪️ Really difficult day', value: 0 },
    ],
    followUp: {
      question: 'What contributed most to how you\'re feeling right now?',
      type: 'text',
      optional: true
    }
  },
  {
    pillar: 'Positive Emotion',
    question: 'How would you rate your overall mood today?',
    options: [
      { label: '😊 Exceptionally good', value: 2 },
      { label: '🙂 Pretty good', value: 1.5 },
      { label: '😐 Just okay', value: 1 },
      { label: '😕 Somewhat low', value: 0.5 },
      { label: '😞 Really struggling', value: 0 },
    ]
  },
  {
    pillar: 'Positive Emotion',
    question: 'Did you experience any moments of joy or gratitude today?',
    options: [
      { label: '😊 Many beautiful moments', value: 2 },
      { label: '🙂 A few nice moments', value: 1.5 },
      { label: '😐 Just small things', value: 1 },
      { label: '🤔 Hard to think of any', value: 0.5 },
      { label: '😕 Nothing comes to mind', value: 0 },
    ],
    followUp: {
      question: 'What was one thing you were grateful for today?',
      type: 'text',
      optional: true
    }
  },
  {
    pillar: 'Positive Emotion',
    question: 'What was your energy level like today?',
    options: [
      { label: '⚡ Full of energy and vitality', value: 2 },
      { label: '🔋 Pretty good overall', value: 1.5 },
      { label: '🔌 Average energy', value: 1 },
      { label: '🪫 Running a bit low', value: 0.5 },
      { label: '😴 Completely drained', value: 0 },
    ]
  },
  {
    pillar: 'Positive Emotion',
    question: 'How would you describe your stress levels today?',
    options: [
      { label: '😌 Completely relaxed', value: 2 },
      { label: '😊 Mostly calm', value: 1.5 },
      { label: '😐 Some stress but manageable', value: 1 },
      { label: '😟 Quite stressed', value: 0.5 },
      { label: '😫 Completely overwhelmed', value: 0 },
    ]
  },

  // Engagement (5 questions)
  {
    pillar: 'Engagement',
    question: 'How absorbed were you in your activities today?',
    options: [
      { label: '🎯 Completely in the zone', value: 2 },
      { label: '🎨 Had some moments of deep focus', value: 1.5 },
      { label: '🤹‍♂️ Some focus, some distractions', value: 1 },
      { label: '🔄 Mostly going through the motions', value: 0.5 },
      { label: '😕 Hard to stay focused today', value: 0 },
    ],
    followUp: {
      question: 'What activity captured your attention the most today?',
      type: 'text',
      optional: true
    }
  },
  {
    pillar: 'Engagement',
    question: 'How present were you in your activities today?',
    options: [
      { label: '🧘‍♂️ Completely in the moment', value: 2 },
      { label: '👀 Mostly present', value: 1.5 },
      { label: '🤔 Somewhat distracted', value: 1 },
      { label: '📱 Mind wandering a lot', value: 0.5 },
      { label: '🌪️ Very scattered', value: 0 },
    ]
  },
  {
    pillar: 'Engagement',
    question: 'How challenging were your activities today?',
    options: [
      { label: '🧠 Perfectly challenging', value: 2 },
      { label: '⚖️ Good balance', value: 1.5 },
      { label: '🔄 Mixed difficulty', value: 1 },
      { label: '😴 Too easy', value: 0.5 },
      { label: '😫 Overwhelmingly hard', value: 0 },
    ]
  },
  {
    pillar: 'Engagement',
    question: 'How interested were you in your activities today?',
    options: [
      { label: '🤩 Completely engaged and interested', value: 2 },
      { label: '😊 Generally interested', value: 1.5 },
      { label: '😐 Some interesting, some not', value: 1 },
      { label: '😕 Mostly uninteresting', value: 0.5 },
      { label: '😞 Completely disengaged', value: 0 },
    ]
  },
  {
    pillar: 'Engagement',
    question: 'How would you rate your productivity today?',
    options: [
      { label: '🚀 Extremely productive', value: 2 },
      { label: '📈 More productive than usual', value: 1.5 },
      { label: '📊 About average', value: 1 },
      { label: '📉 Less productive than usual', value: 0.5 },
      { label: '😴 Not productive at all', value: 0 },
    ]
  },

  // Relationships (5 questions)
  {
    pillar: 'Relationships',
    question: 'How connected did you feel to others today?',
    options: [
      { label: '💞 Deeply connected and supported', value: 2 },
      { label: '🤝 Some good interactions', value: 1.5 },
      { label: '👥 A few brief connections', value: 1 },
      { label: '🌌 Felt a bit distant from others', value: 0.5 },
      { label: '🏝️ Pretty isolated today', value: 0 },
    ],
    followUp: {
      question: 'Who or what made you feel most connected today?',
      type: 'text',
      optional: true
    }
  },
  {
    pillar: 'Relationships',
    question: 'How supported did you feel today?',
    options: [
      { label: '🤗 Completely supported', value: 2 },
      { label: '💪 Pretty well supported', value: 1.5 },
      { label: '🤝 Adequately supported', value: 1 },
      { label: '🫂 Could use more support', value: 0.5 },
      { label: '🏝️ Felt quite alone', value: 0 },
    ]
  },
  {
    pillar: 'Relationships',
    question: 'How well did you communicate your needs today?',
    options: [
      { label: '💬 Clearly and effectively', value: 2 },
      { label: '🗣️ Pretty well overall', value: 1.5 },
      { label: '🤐 Could have been better', value: 1 },
      { label: '😶 Struggled to speak up', value: 0.5 },
      { label: '🙊 Didn\'t express myself', value: 0 },
    ]
  },
  {
    pillar: 'Relationships',
    question: 'How would you describe your social interactions today?',
    options: [
      { label: '🤩 Fulfilling and meaningful', value: 2 },
      { label: '😊 Generally positive', value: 1.5 },
      { label: '😐 Mixed bag', value: 1 },
      { label: '😕 Mostly superficial', value: 0.5 },
      { label: '😞 Negative or draining', value: 0 },
    ]
  },
  {
    pillar: 'Relationships',
    question: 'Did you feel understood by others today?',
    options: [
      { label: '💯 Completely understood', value: 2 },
      { label: '👍 Mostly understood', value: 1.5 },
      { label: '🤷‍♂️ Some did, some didn\'t', value: 1 },
      { label: '😕 Felt misunderstood', value: 0.5 },
      { label: '😞 Completely misunderstood', value: 0 },
    ]
  },

  // Meaning (5 questions)
  {
    pillar: 'Meaning',
    question: 'How meaningful did today feel?',
    options: [
      { label: '🌟 Deeply purposeful and significant', value: 2 },
      { label: '✨ Some meaningful moments', value: 1.5 },
      { label: '🔍 Still searching for meaning today', value: 1 },
      { label: '🌫️ Felt a bit aimless', value: 0.5 },
      { label: '❓ Hard to find meaning today', value: 0 },
    ],
    followUp: {
      question: 'What gave you a sense of purpose today?',
      type: 'text',
      optional: true
    }
  },
  {
    pillar: 'Meaning',
    question: 'How aligned did your day feel with your values?',
    options: [
      { label: '🎯 Perfect alignment', value: 2 },
      { label: '🧭 Mostly aligned', value: 1.5 },
      { label: '🔄 Some alignment', value: 1 },
      { label: '🔄 Some misalignment', value: 0.5 },
      { label: '❌ Not aligned at all', value: 0 },
    ]
  },
  {
    pillar: 'Meaning',
    question: 'How connected do you feel to something larger than yourself?',
    options: [
      { label: '🌌 Deeply connected', value: 2 },
      { label: '🌠 Somewhat connected', value: 1.5 },
      { label: '🔍 Occasionally felt it', value: 1 },
      { label: '🌫️ Felt distant', value: 0.5 },
      { label: '🏝️ Completely disconnected', value: 0 },
    ]
  },
  {
    pillar: 'Meaning',
    question: 'How would you rate your sense of purpose today?',
    options: [
      { label: '🚀 Strong and clear', value: 2 },
      { label: '✨ Present but not overwhelming', value: 1.5 },
      { label: '🤔 Somewhat uncertain', value: 1 },
      { label: '😕 Hard to find', value: 0.5 },
      { label: '❌ Completely lacking', value: 0 },
    ]
  },
  {
    pillar: 'Meaning',
    question: 'Did you feel like you made a difference today?',
    options: [
      { label: '🌟 Made a significant impact', value: 2 },
      { label: '✨ Made a small difference', value: 1.5 },
      { label: '🤷‍♂️ Not sure', value: 1 },
      { label: '😕 Probably not', value: 0.5 },
      { label: '❌ Not at all', value: 0 },
    ]
  },

  // Accomplishment (5 questions)
  {
    pillar: 'Accomplishment',
    question: 'How do you feel about what you accomplished today?',
    options: [
      { label: '🏆 Exceeded my expectations', value: 2 },
      { label: '✅ Made solid progress', value: 1.5 },
      { label: '🔄 Did what I needed to do', value: 1 },
      { label: '⏳ Could have done more', value: 0.5 },
      { label: '😕 Not my most productive day', value: 0 },
    ],
    followUp: {
      question: 'What are you most proud of accomplishing today?',
      type: 'text',
      optional: true
    }
  },
  {
    pillar: 'Accomplishment',
    question: 'How in control of your time did you feel today?',
    options: [
      { label: '⏱️ Completely in control', value: 2 },
      { label: '📊 Mostly managed well', value: 1.5 },
      { label: '🔄 Somewhat balanced', value: 1 },
      { label: '🎢 A bit chaotic', value: 0.5 },
      { label: '🌪️ Completely overwhelmed', value: 0 },
    ]
  },
  {
    pillar: 'Accomplishment',
    question: 'How satisfied are you with what you got done today?',
    options: [
      { label: '😊 Extremely satisfied', value: 2 },
      { label: '🙂 Pretty good', value: 1.5 },
      { label: '😐 Neutral', value: 1 },
      { label: '😕 Somewhat disappointed', value: 0.5 },
      { label: '😞 Very disappointed', value: 0 },
    ]
  },
  {
    pillar: 'Accomplishment',
    question: 'How well did you manage your priorities today?',
    options: [
      { label: '🎯 Perfect prioritization', value: 2 },
      { label: '📈 Mostly good choices', value: 1.5 },
      { label: '🔄 Some good, some not', value: 1 },
      { label: '📉 Could have been better', value: 0.5 },
      { label: '😕 Completely off track', value: 0 },
    ]
  },
  {
    pillar: 'Accomplishment',
    question: 'How would you rate your progress toward your goals?',
    options: [
      { label: '🚀 Made great progress', value: 2 },
      { label: '📈 Steady progress', value: 1.5 },
      { label: '🔄 Some progress', value: 1 },
      { label: '🐌 Very little progress', value: 0.5 },
      { label: '😞 No progress at all', value: 0 },
    ]
  }
];

const MoodTracker = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const user_id = user?.userId ? Number(user.userId) : user?.id ? Number(user.id) : user?.user_id ? Number(user.user_id) : null;
  const todaysQuestions = useMemo(() => getTodaysQuestions(PERMA_QUESTIONS, 5, 8), []);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(Array(todaysQuestions.length).fill(null));
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [tipChat, setTipChat] = useState([]);
  const [tipLoading, setTipLoading] = useState(false);
  const [tipInput, setTipInput] = useState('');
  const [showJournal, setShowJournal] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [visibleStart, setVisibleStart] = useState(0);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [lastSession, setLastSession] = useState(null);
  const chatContainerRef = useRef(null);
  const [historicalMoods, setHistoricalMoods] = useState([]);
  const [moodTrends, setMoodTrends] = useState({});
  const [showHistoricalAnalysis, setShowHistoricalAnalysis] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [nextCheckInTime, setNextCheckInTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const visibleCount = 2;
  const canGoLeft = visibleStart > 0;
  const canGoRight = visibleStart + visibleCount < todaysQuestions.length;
  const visibleQuestions = todaysQuestions.slice(visibleStart, visibleStart + visibleCount);
  const allAnswered = answers.every(a => a !== null);

  const resetInteraction = () => {
    setShowTip(false);
    setShowJournal(false);
    setShowGoal(false);
  };

  // Check if user can do another check-in today
  useEffect(() => {
    async function checkDailyLimit() {
      if (isAuthLoading || !user_id) {
        // Wait for auth to load or user_id to be available
        setIsLoading(false); // Ensure component loading state is also false while waiting
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const { count, can_check_in, next_check_in } = await checkDailySessionCount();
        setCanCheckIn(can_check_in);
        setNextCheckInTime(next_check_in ? new Date(next_check_in) : null);
        setSessionsToday(count);
        
        if (count > 0) {
          const recent = await fetchRecentMoodSessions(user_id, 1);
          setLastSession(recent[0]);
        }
      } catch (error) {
        console.error('Error checking daily limit:', error);
        setError('Failed to check daily limit. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    checkDailyLimit();
  }, [user_id, isAuthLoading]);

  // Format time remaining until next check-in
  const getTimeUntilNextCheckIn = () => {
    if (!nextCheckInTime) return '';
    const now = new Date();
    const diff = nextCheckInTime - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Fetch historical moods on mount
  useEffect(() => {
    async function fetchHistoricalMoods() {
      if (isAuthLoading || !user_id) {
         // Wait for auth to load or user_id to be available
        return;
      }
      try {
        const recentSessions = await fetchRecentMoodSessions(user_id, 5);
        setHistoricalMoods(recentSessions);
        
        // Calculate trends for each PERMA pillar
        const trends = {};
        PERMA_PILLARS.forEach(pillar => {
          const scores = recentSessions.map(session => session.perma_scores?.[pillar] || 0); // Added safe access
          const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0; // Added division by zero check
          const trend = scores.map((score, i) => i === 0 ? 0 : score - (scores[i - 1] || 0)); // Added safe access
          trends[pillar] = {
            average: avg,
            trend: trend,
            improvement: trend[trend.length - 1] > 0,
            consistency: Math.max(...scores) - Math.min(...scores) < 0.5
          };
        });
        setMoodTrends(trends);
      } catch (error) {
        console.error('Error fetching historical moods:', error);
      }
    }
    fetchHistoricalMoods();
  }, [user_id, isAuthLoading]); // Add isAuthLoading to dependency array

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [tipChat]);

  const handleAnswer = (idx, optionValue) => {
    const updated = [...answers];
    updated[idx] = optionValue;
    setAnswers(updated);
    if (idx < todaysQuestions.length - 1) {
      setStep(idx + 1);
    }
  };

  const handleSubmit = async () => {
    if (!canCheckIn || isAuthLoading || !user_id) {
      if (!canCheckIn) setError('You have reached your daily limit of 2 mood check-ins.');
      else if (isAuthLoading) setError('Authentication is still loading.');
      else if (!user_id) setError('User not logged in.');
      return;
    }

    if (!user) {
      setError('Please log in to save your mood session.');
      return;
    }

    setShowAnalysis(true);
    try {
      // Get the analyzed PERMA scores and overall score
      const { avgScores, strong, weak, overallScore } = analyzePERMA();
      const { suggestion } = getAnalysisMessage();
      
      // Create a detailed summary with scores
      const summary = `Overall: ${overallScore}/10 | ` +
        `Strongest: ${strong || 'N/A'} | ` +
        `Needs attention: ${weak || 'N/A'} | ` +
        `Scores: ${Object.entries(avgScores)
          .map(([k, v]) => `${k}: ${Math.round(v * 5)}`)
          .join(', ')}`;
      
      // Prepare the answers with question text, selected option, and score
      const formattedAnswers = todaysQuestions.map((q, i) => {
        const answerIndex = answers[i];
        const selectedOption = answerIndex !== null ? 
          q.options[Math.round(answerIndex * (q.options.length - 1))] : null;
          
        return {
          question: q.question,
          pillar: q.pillar,
          answer: selectedOption ? selectedOption.label : 'Not answered',
          score: selectedOption ? Math.round(selectedOption.value * 5) : 0,
          rawScore: selectedOption ? selectedOption.value : null
        };
      });

      // Save the session with all the data
      const result = await saveMoodSession({
        perma_scores: {
          ...avgScores,
          'Overall Score': overallScore
        },
        answers: formattedAnswers,
        summary,
        suggestion,
        timestamp: new Date().toISOString()
      });

      if (result.daily_sessions >= 2) {
        setCanCheckIn(false);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        setNextCheckInTime(tomorrow);
      }

      setSessionsToday(result.daily_sessions);
    } catch (error) {
      console.error('Error saving session:', error);
      setError('Failed to save mood session. Please try again.');
    }
  };

  // Helper to get description for a pillar based on score (0-10 scale)
  const getPillarDescription = (pillar, score) => {
    const descriptions = {
      'Positive Emotion': {
        high: 'You\'re experiencing many positive emotions. Keep doing what brings you joy!',
        medium: 'Your positive emotions are at a moderate level. What could bring you more joy today?',
        low: 'You might be feeling fewer positive emotions. Consider activities that usually lift your mood.'
      },
      'Engagement': {
        high: 'You\'re fully engaged in your activities. Keep finding those flow states!',
        medium: 'You have moderate engagement. Look for activities that fully capture your attention.',
        low: 'You might be feeling disengaged. Try activities that challenge and interest you.'
      },
      'Relationships': {
        high: 'Your relationships are strong and supportive. Nurture these connections!',
        medium: 'Your relationships could use more attention. Consider reaching out to someone today.',
        low: 'You might be feeling disconnected. Even small social interactions can help.'
      },
      'Meaning': {
        high: 'You feel a strong sense of purpose. Your life has deep meaning and direction.',
        medium: 'You have some sense of meaning. Reflect on what truly matters to you.',
        low: 'You might be searching for more meaning. Consider what gives your life purpose.'
      },
      'Accomplishment': {
        high: 'You\'re achieving your goals and feeling capable. Celebrate your progress!',
        medium: 'You\'re making steady progress. Keep setting and working toward your goals.',
        low: 'You might be feeling less accomplished. Start with small, achievable goals.'
      }
    };
    
    const level = score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low';
    return descriptions[pillar]?.[level] || '';
  };

  // Function to render historical mood analysis
  const renderHistoricalAnalysis = () => {
    if (!historicalMoods.length) return null;

    const moodEmojis = {
      'Positive Emotion': '😊',
      'Engagement': '🧠',
      'Relationships': '❤️',
      'Meaning': '🌟',
      'Accomplishment': '🏆',
      'Overall Score': '📊'
    };

    // Calculate average scores for each pillar (convert to 0-10 scale for display)
    const averageScores = {};
    const allPillars = [...PERMA_PILLARS, 'Overall Score'];
    
    allPillars.forEach(pillar => {
      const scores = historicalMoods
        .map(session => {
          const score = session.perma_scores[pillar];
          // Convert 0-2 scale to 0-10 for display if needed
          return score !== undefined ? (pillar === 'Overall Score' ? score : score * 5) : 0;
        })
        .filter(score => score > 0); // Only include sessions with scores
        
      averageScores[pillar] = scores.length > 0 
        ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
        : 0;
    });

    // Get date range
    const startDate = new Date(historicalMoods[historicalMoods.length - 1].timestamp);
    const endDate = new Date(historicalMoods[0].timestamp);
    const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    // Calculate trends (improving, declining, or stable)
    const calculateTrend = (pillar) => {
      const scores = historicalMoods
        .map(session => session.perma_scores[pillar])
        .filter(score => score !== undefined);
      
      if (scores.length < 2) return 'stable';
      
      const first = scores[0];
      const last = scores[scores.length - 1];
      const diff = last - first;
      
      if (diff > 0.2) return 'improving';
      if (diff < -0.2) return 'declining';
      return 'stable';
    };

    // Get trend emoji
    const getTrendEmoji = (trend) => {
      switch (trend) {
        case 'improving': return '📈';
        case 'declining': return '📉';
        default: return '➡️';
      }
    };

    // Get color class based on score (0-10 scale)
    const getScoreColor = (score) => {
      if (score >= 7) return 'text-green-600';
      if (score >= 4) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3">
          Your PERMA Analysis ({dateRange})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(averageScores).map(([pillar, score]) => {
            const trend = calculateTrend(pillar);
            const trendEmoji = getTrendEmoji(trend);
            const scoreColor = getScoreColor(score);
            const displayScore = pillar === 'Overall Score' ? score : score;
            
            return (
              <div 
                key={pillar} 
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{moodEmojis[pillar]}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {pillar}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold ${scoreColor}`}>
                      {displayScore.toFixed(1)}/10
                    </span>
                    {historicalMoods.length > 1 && (
                      <span 
                        className={`text-xs ${
                          trend === 'improving' ? 'text-green-500' : 
                          trend === 'declining' ? 'text-red-500' : 
                          'text-gray-500'
                        }`}
                        title={`${trend} trend`}
                      >
                        {trendEmoji}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      score >= 7 ? 'bg-green-500' :
                      score >= 4 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} 
                    style={{ 
                      width: `${Math.max(0, Math.min(100, (Number(score) || 0) * 10))}%`,
                      transition: 'width 0.3s ease-in-out'
                    }}
                  ></div>
                </div>
                {pillar !== 'Overall Score' && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {getPillarDescription(pillar, score)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Enhanced chat handler with historical context
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!tipInput.trim() || tipLoading) return;

    const userMessage = tipInput.trim();
    setTipChat(prev => [...prev, { role: 'user', text: userMessage }]);
    setTipInput('');
    setTipLoading(true);

    try {
      const perma_scores = lastSession?.perma_scores || analyzePERMA().avgScores;
      const summary = lastSession?.summary || `Strongest pillar: ${analyzePERMA().strong}, weakest pillar: ${analyzePERMA().weak}`;
      
      // Enhanced history with trend analysis
      let history = '';
      try {
        const recentSessions = await fetchRecentMoodSessions(user_id, 5);
        history = recentSessions.map((s, i) => {
          const trend = moodTrends[analyzePERMA().weak];
          return `Session ${recentSessions.length-i}:\nPERMA: ${JSON.stringify(s.perma_scores)}\nSummary: ${s.summary}\nTrend: ${trend.improvement ? 'Improving' : 'Needs attention'}\n`;
        }).join('\n');
      } catch (error) {
        console.error('Error fetching history:', error);
      }

      const aiResp = await getPermaTipConversation({ 
        perma_scores, 
        summary, 
        userMessage, 
        history,
        trends: moodTrends
      });

      let tipText = aiResp.response;
      if (typeof tipText === 'string') {
        try {
          const parsed = JSON.parse(tipText);
          tipText = parsed.humanized || parsed.text || parsed.response || JSON.stringify(parsed);
        } catch (e) {}
      } else if (typeof tipText === 'object') {
        tipText = tipText.humanized || tipText.text || tipText.response || JSON.stringify(tipText);
      }

      setTipChat(prev => [...prev, { role: 'ai', text: tipText || 'No response from AI.' }]);
    } catch (error) {
      console.error('Error in chat:', error);
      setTipChat(prev => [...prev, { 
        role: 'ai', 
        text: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setTipLoading(false);
    }
  };

  // Analyze answers by PERMA
  function analyzePERMA() {
    // Map answers to pillars
    let pillarScores = {};
    PERMA_PILLARS.forEach(p => pillarScores[p] = []);
    
    // Group answers by pillar
    todaysQuestions.forEach((q, i) => {
      if (answers[i] !== null) { // Only include answered questions
        pillarScores[q.pillar].push(answers[i]);
      }
    });
    
    // Calculate average score for each pillar (0-2 scale)
    let avgScores = {};
    let totalScore = 0;
    let totalPillars = 0;
    
    PERMA_PILLARS.forEach(p => {
      if (pillarScores[p].length > 0) {
        // Calculate average for this pillar (0-2 scale)
        const sum = pillarScores[p].reduce((a, b) => a + b, 0);
        avgScores[p] = parseFloat((sum / pillarScores[p].length).toFixed(2));
        totalScore += avgScores[p];
        totalPillars++;
      } else {
        avgScores[p] = 0; // Default to 0 if no questions answered for this pillar
      }
    });
    
    // Calculate overall PERMA score (0-10 scale for display)
    const overallScore = totalPillars > 0 ? (totalScore / totalPillars) * 5 : 0;
    
    // Find strong and weak pillars (only consider pillars with answers)
    const pillarsWithAnswers = Object.entries(avgScores)
      .filter(([_, score]) => score > 0);
      
    let strong = 'Positive Emotion'; // Default values
    let weak = 'Positive Emotion';
    
    if (pillarsWithAnswers.length > 0) {
      // Sort by score to find strongest and weakest
      const sorted = [...pillarsWithAnswers].sort((a, b) => b[1] - a[1]);
      strong = sorted[0][0];
      weak = sorted[sorted.length - 1][0];
      
      // If all scores are equal, don't highlight any as weak
      if (sorted[0][1] === sorted[sorted.length - 1][1]) {
        weak = '';
      }
    }
    
    return { 
      avgScores, 
      strong, 
      weak,
      overallScore: parseFloat(overallScore.toFixed(1)) // 0-10 scale
    };
  }

  function getAnalysisMessage() {
    const { avgScores, strong, weak, overallScore } = analyzePERMA();
    
    // Helper to convert 0-2 score to 0-10 scale
    const getScoreOutOf10 = (score) => Math.round(score * 5);
    
    // Get emoji for score (0-10 scale)
    const getScoreEmoji = (score) => {
      const score10 = getScoreOutOf10(score);
      if (score10 >= 9) return '🌟';
      if (score10 >= 7) return '😊';
      if (score10 >= 5) return '😐';
      if (score10 >= 3) return '😕';
      return '😞';
    };
    
    // Get score description
    const getScoreDescription = (score) => {
      const score10 = getScoreOutOf10(score);
      if (score10 >= 9) return 'Excellent';
      if (score10 >= 7) return 'Good';
      if (score10 >= 5) return 'Average';
      if (score10 >= 3) return 'Below average';
      return 'Needs attention';
    };
    
    // Start with overall score and description
    const overallEmoji = getScoreEmoji(overallScore/2);
    const overallDescription = getScoreDescription(overallScore/2);
    let msg = `Your overall well-being is *${overallDescription.toLowerCase()}* (${overallScore}/10) ${overallEmoji}`;
    
    // Add strong areas if any (scores above 1.6 / 8/10)
    const strongPillars = Object.entries(avgScores)
      .filter(([p, score]) => score > 1.6 && p !== 'Overall Score')
      .sort((a, b) => b[1] - a[1])
      .map(([pillar, score]) => `${pillar} (${getScoreOutOf10(score)}/10)`);
      
    if (strongPillars.length > 0) {
      msg += `\n\nYour strengths: ${strongPillars.join(', ')}`;
    }
    
    // Add areas for improvement (scores below 1.4 / 7/10, excluding zero scores)
    const weakPillars = Object.entries(avgScores)
      .filter(([p, score]) => score < 1.4 && score > 0 && p !== 'Overall Score')
      .sort((a, b) => a[1] - b[1])
      .map(([p, score]) => ({
        name: p,
        score: getScoreOutOf10(score),
        description: getPillarDescription(p, score)
      }));
      
    if (weakPillars.length > 0) {
      msg += '\n\nAreas to nurture:';
      weakPillars.forEach(pillar => {
        msg += `\n• *${pillar.name}* (${pillar.score}/10): ${pillar.description}`;
      });
    }
    
    // Suggestion based on weakest pillar
    let suggestion = '';
    if (weak) {
      const pillarName = weak.toLowerCase();
      const suggestions = {
        'relationships': [
          'Consider reaching out to a friend or loved one today. Even a quick message can strengthen your connection.',
          'Social connections thrive on quality time. Could you schedule a coffee chat or phone call with someone important to you?',
          'Who in your life could use some extra support right now? Reaching out benefits both of you.'
        ],
        'meaning': [
          'Reflect on what gives your life purpose. What activities or values feel most meaningful to you?',
          'Consider volunteering or helping someone today. Even small acts can create a sense of purpose.',
          'Journal about what truly matters to you. What legacy would you like to create?'
        ],
        'engagement': [
          'What activity makes you lose track of time? Schedule time for it today.',
          'Try a new hobby or skill that challenges you just the right amount.',
          'Break down a complex task into smaller, more engaging chunks.'
        ],
        'accomplishment': [
          'Set a small, achievable goal for today. Celebrate when you complete it!',
          'What\'s one task you\'ve been putting off? Commit to working on it for just 5 minutes.'
        ],
        'positive emotion': [
          'Practice gratitude: list three things you\'re thankful for right now.',
          'Take a mindful moment to appreciate something beautiful around you.'
        ]
      };
      
      const pillarSuggestions = suggestions[pillarName] || [
        'What\'s one small thing you could do today to take care of yourself?'
      ];
      
      // Pick a random suggestion for this pillar
      suggestion = pillarSuggestions[Math.floor(Math.random() * pillarSuggestions.length)];
      
      // Add context to the suggestion
      suggestion = `Since you mentioned ${weak}, here's a suggestion: ${suggestion}`;
    }
    
    // Format the final message
    const getTimeBasedGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      return 'Good evening';
    };
    
    const greeting = getTimeBasedGreeting();
    const userName = user?.name || 'there';
    
    // Format the final message
    const formattedMessage = [
      `${greeting}${userName ? ` ${userName.split(' ')[0]}` : ''}!`,
      `Here's your well-being snapshot:`,  
      '',
      msg
    ].join('\n');
    
    return {
      msg: formattedMessage,
      suggestion: suggestion || 'Would you like to explore ways to enhance your well-being?',
      overallScore,
      strongPillars: strongPillars.map(p => p.split(' (')[0]),
      weakPillars: weakPillars.map(p => p.name)
    };
  }

function getFinalEncouragement() {
  const { strong, weak, overallScore } = analyzePERMA();
  const scoreOutOf10 = Math.round((overallScore / 2) * 10) / 10; // Convert to 0-10 scale
  
  // Base encouragements based on overall score
  let encouragements = [];
  
  if (scoreOutOf10 >= 8) {
    encouragements = [
      `Your well-being is thriving! Your strength in ${strong} is really shining through.`,
      `You're doing an amazing job! Your high score shows great balance and resilience.`,
      `Your positive energy is contagious! Keep nurturing what's working well for you.`
    ];
  } else if (scoreOutOf10 >= 6) {
    encouragements = [
      `You're making great progress! Your strength in ${strong} is a real asset.`,
      `You're on a good path. Every small step counts toward your well-being.`,
      `Your self-awareness is growing. Keep focusing on what makes you feel your best.`
    ];
  } else {
    encouragements = [
      `Remember that every day is a new opportunity. You're stronger than you think!`,
      `It's okay to have ups and downs. Your awareness is the first step toward positive change.`,
      `Be kind to yourself. Growth takes time, and you're doing the right thing by checking in.`
    ];
  }
  
  // Add specific encouragement based on strongest pillar
  const pillarEncouragements = {
    'Positive Emotion': `Your positive outlook is a real strength. Keep focusing on what brings you joy!`,
    'Engagement': `Your ability to be fully engaged in activities is a gift. Keep finding those flow states!`,
    'Relationships': `Your relationships are a source of strength. Nurture these connections!`,
    'Meaning': `Your sense of purpose is inspiring. Keep aligning with what matters most to you.`,
    'Accomplishment': `Your drive to achieve is impressive. Celebrate your progress along the way!`
  };
  
  // Add specific encouragement for the weakest area if it's significantly lower
  if (weak) {
    const improvementTips = {
      'Positive Emotion': 'Try to notice and savor small positive moments throughout your day.',
      'Engagement': 'Look for activities that fully capture your attention and interest.',
      'Relationships': 'Consider reaching out to someone you care about today.',
      'Meaning': 'Reflect on what gives your life purpose and meaning.',
      'Accomplishment': 'Set a small, achievable goal and celebrate when you complete it.'
    };
    
    encouragements.push(
      `Your awareness of areas to grow, like ${weak}, shows real self-understanding. ${improvementTips[weak] || ''}`
    );
  }
  
  // Add the pillar-specific encouragement
  if (pillarEncouragements[strong]) {
    encouragements.push(pillarEncouragements[strong]);
  }
  
  // Add a random general encouragement
  const generalEncouragements = [
    `Remember to be kind to yourself. Progress matters more than perfection.`,
    `You're doing better than you think. Every step forward counts!`,
    `Your well-being matters. Keep prioritizing what helps you feel your best.`,
    `Small, consistent actions lead to big changes over time.`
  ];
  
  encouragements.push(generalEncouragements[Math.floor(Math.random() * generalEncouragements.length)]);
  
  // Return a random encouragement from the compiled list
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}

function getAnalysisMessage() {
  const { avgScores, strong, weak, overallScore } = analyzePERMA();
  
  // Helper to convert 0-2 score to 0-10 scale
  const getScoreOutOf10 = (score) => Math.round(score * 5);
  
  // Get emoji for score (0-10 scale)
  const getScoreEmoji = (score) => {
    const score10 = getScoreOutOf10(score);
    if (score10 >= 9) return '🌟';
    if (score10 >= 7) return '😊';
    if (score10 >= 5) return '😐';
    if (score10 >= 3) return '😕';
    return '😞';
  };
  
  // Get score description
  const getScoreDescription = (score) => {
    const score10 = getScoreOutOf10(score);
    if (score10 >= 9) return 'Excellent';
    if (score10 >= 7) return 'Good';
    if (score10 >= 5) return 'Average';
    if (score10 >= 3) return 'Below average';
    return 'Needs attention';
  };
  
  // Start with overall score and description
  const overallEmoji = getScoreEmoji(overallScore/2);
  const overallDescription = getScoreDescription(overallScore/2);
  let msg = `Your overall well-being is *${overallDescription.toLowerCase()}* (${overallScore}/10) ${overallEmoji}`;
  
  // Add strong areas if any (scores above 1.6 / 8/10)
  const strongPillars = Object.entries(avgScores)
    .filter(([p, score]) => score > 1.6 && p !== 'Overall Score')
    .sort((a, b) => b[1] - a[1])
    .map(([pillar, score]) => `${pillar} (${getScoreOutOf10(score)}/10)`);
    
  if (strongPillars.length > 0) {
    msg += `\n\nYour strengths: ${strongPillars.join(', ')}`;
  }
  
  // Add areas for improvement (scores below 1.4 / 7/10, excluding zero scores)
  const weakPillars = Object.entries(avgScores)
    .filter(([p, score]) => score < 1.4 && score > 0 && p !== 'Overall Score')
    .sort((a, b) => a[1] - b[1])
    .map(([p, score]) => ({
      name: p,
      score: getScoreOutOf10(score),
      description: getPillarDescription(p, score)
    }));
    
  if (weakPillars.length > 0) {
    msg += '\n\nAreas to nurture:';
    weakPillars.forEach(pillar => {
      msg += `\n• *${pillar.name}* (${pillar.score}/10): ${pillar.description}`;
    });
  }
  
  // Add suggestion based on weakest area
  let suggestion = '';
  if (weak) {
    const suggestions = {
      'Positive Emotion': [
        'Pause for a moment of gratitude or enjoy something simple—a song, a walk, or a deep breath.',
        'Notice and name three things you can see, hear, and feel right now.'
      ],
      'Engagement': [
        'Find an activity that fully captures your attention, even for just 10 minutes.',
        'Try something new today to spark your curiosity and engagement.'
      ],
      'Relationships': [
        'Reach out to someone you care about with a quick message or call.',
        'Plan a small social activity with someone important to you.'
      ],
      'Meaning': [
        'Reflect on what gives your life purpose and meaning today.',
        'Consider how your daily actions align with your values.'
      ],
      'Accomplishment': [
        'Set a tiny, achievable goal for today—like tidying your desk or finishing a small task.',
        'Break down a larger task into smaller, more manageable steps.'
      ]
    };
    
    const pillarSuggestions = suggestions[weak] || [
      'What\'s one small thing you could do today to take care of yourself?'
    ];
    
    suggestion = pillarSuggestions[Math.floor(Math.random() * pillarSuggestions.length)];
  }
  
  // Format the final message with time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  
  const greeting = getTimeBasedGreeting();
  const userName = user?.name || 'there';
  
  // Format the final message
  const formattedMessage = [
    `${greeting}${userName ? ` ${userName.split(' ')[0]}` : ''}!`,
    `Here's your well-being snapshot:`,
    '',
    msg
  ].join('\n');
  
  return {
    msg: formattedMessage,
    suggestion: suggestion || 'Would you like to explore ways to enhance your well-being?',
    overallScore,
    strongPillars: strongPillars.map(p => p.split(' (')[0]),
    weakPillars: weakPillars.map(p => p.name)
  };
}

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-100 dark:border-gray-700 w-full mx-auto text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <div className="text-lg text-gray-700 dark:text-gray-300">
            Loading your mood sessions...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-100 dark:border-gray-700 w-full mx-auto text-center">
        <div className="text-red-600 dark:text-red-400 mb-4">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!canCheckIn) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-100 dark:border-gray-700 w-full mx-auto text-center">
        <div className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-4">
          You've completed your 2 Mood Check-ins for today! 🌞
        </div>
        
        {nextCheckInTime && (
          <div className="text-gray-600 dark:text-gray-300 mb-6">
            Next check-in available in: {getTimeUntilNextCheckIn()}
          </div>
        )}

        {/* PERMA Results Display */}
        <div className="mb-6 text-base text-gray-700 dark:text-gray-200">
          <div className="mb-2 font-bold text-blue-700 dark:text-blue-200 text-xl flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v4h-1m-2-4h.01M17 16h.01M7 16h.01M7 8h.01M17 8h.01" />
            </svg>
            Your PERMA Results
          </div>
          
          {/* PERMA Scores Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            {lastSession && Object.entries(lastSession.perma_scores).map(([pillar, score]) => {
              const icons = {
                'Positive Emotion': '😊',
                'Engagement': '🧠',
                'Relationships': '❤️',
                'Meaning': '🌟',
                'Accomplishment': '🏆',
              };
              
              const summary = lastSession.summary?.split('Answers:')[0] || '';
              const strongMatch = summary.match(/Strongest pillar: ([^,]+)/);
              const weakMatch = summary.match(/weakest pillar: ([^.]+)/);
              const strong = strongMatch ? strongMatch[1].trim() : '';
              const weak = weakMatch ? weakMatch[1].trim() : '';
              
              const border = pillar === strong ? 'ring-2 ring-green-400 shadow-green-200' :
                           pillar === weak ? 'ring-2 ring-red-400 shadow-red-200' : '';
              
              return (
                <div key={pillar} 
                     className={`rounded-xl bg-white/80 dark:bg-gray-800/80 px-4 py-3 shadow transition-all duration-300 flex items-center gap-3 ${border}`}>
                  <span className="text-2xl mr-2">{icons[pillar]}</span>
                  <span className="font-semibold w-32 inline-block text-gray-700 dark:text-gray-200">{pillar}</span>
                  <div className="flex-1">
                    <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-4 rounded-full transition-all duration-700 ${
                        pillar === strong ? 'bg-green-400' : 
                        pillar === weak ? 'bg-red-400' : 
                        'bg-blue-400'
                      }`}
                           style={{ 
                             width: `${Math.max(0, Math.min(100, Math.round((Number(score) || 0) * 50)))}%`,
                             minWidth: '8%',
                             transition: 'width 0.3s ease-in-out'
                           }}>
                      </div>
                    </div>
                  </div>
                  <span className="ml-2 font-bold text-lg">{score.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historical Analysis */}
        {renderHistoricalAnalysis()}

        {/* PERMA Chat UI - Only show if user has completed both check-ins */}
        <div className="flex flex-col items-center mt-6">
          <button
            onClick={async () => {
              setShowTip(true);
              setTipChat([]);
              setTipLoading(true);
              try {
                const perma_scores = lastSession.perma_scores;
                const summary = lastSession.summary;
                let history = '';
                try {
                  const recentSessions = await fetchRecentMoodSessions(user_id, 5);
                  history = recentSessions.map((s, i) => {
                    const trend = moodTrends[analyzePERMA().weak];
                    return `Session ${recentSessions.length-i}:\nPERMA: ${JSON.stringify(s.perma_scores)}\nSummary: ${s.summary}\nTrend: ${trend.improvement ? 'Improving' : 'Needs attention'}\n`;
                  }).join('\n');
                } catch (error) {
                  console.error('Error fetching history:', error);
                }
                
                const aiResp = await getPermaTipConversation({ 
                  perma_scores, 
                  summary, 
                  userMessage: '', 
                  history,
                  trends: moodTrends
                });
                
                let tipText = aiResp.response;
                if (typeof tipText === 'string') {
                  try {
                    const parsed = JSON.parse(tipText);
                    tipText = parsed.humanized || parsed.text || parsed.response || JSON.stringify(parsed);
                  } catch (e) {
                    // Not JSON, leave as is
                  }
                } else if (typeof tipText === 'object') {
                  tipText = tipText.humanized || tipText.text || tipText.response || JSON.stringify(tipText);
                }
                
                setTipChat([{role:'ai', text: tipText || 'No response from AI.'}]);
              } catch (error) {
                console.error('Error in initial chat:', error);
                setTipChat([{role:'ai', text: 'Sorry, I encountered an error. Please try again.'}]);
              } finally {
                setTipLoading(false);
              }
            }}
            className="px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium hover:bg-blue-200 mb-2"
          >
            Chat with PERMA AI
          </button>

          {showTip && (
            <div className="mt-4 w-full flex flex-col items-center">
              <div
                className="bg-blue-50 dark:bg-blue-900 rounded-xl p-4 w-full text-left mb-2 shadow overflow-y-auto"
                style={{ maxHeight: '350px', minHeight: '120px' }}
              >
                {tipChat.map((msg, i) => (
                  <ChatBubble
                    key={i}
                    sender={msg.role}
                    text={msg.text}
                    pillar={msg.pillar}
                    isTyping={tipLoading && i === tipChat.length - 1 && msg.role === 'ai'}
                  />
                ))}
                {tipLoading && (
                  <ChatBubble 
                    sender="ai" 
                    text="" 
                    isTyping 
                    pillar={tipChat.length > 0 && tipChat[tipChat.length-1].pillar} 
                  />
                )}
                <div ref={chatContainerRef} />
              </div>

              {!tipLoading && tipChat.length > 0 && (
                <QuickReplies
                  replies={["👍 Sounds good", "Give me a tip", "Tell me more", "😊", "How do I improve?"]}
                  onReply={r => {
                    setTipInput(r);
                    setTimeout(() => {
                      document.getElementById('perma-chat-input')?.focus();
                    }, 100);
                  }}
                />
              )}

              <form
                className="flex gap-2 w-full mt-2"
                onSubmit={handleChatSubmit}
              >
                <input
                  id="perma-chat-input"
                  className="flex-1 rounded-lg border px-3 py-2 dark:bg-gray-800 dark:text-white"
                  placeholder="Say something to PERMA AI..."
                  value={tipInput}
                  onChange={e => setTipInput(e.target.value)}
                  disabled={tipLoading}
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-40" 
                  disabled={tipLoading || !tipInput.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
        <span role="img" aria-label="Lotus position">🧘‍♂️</span> Mood Tracker
      </h1>
      
      {showAnalysis ? (
        <div className="mb-6">
          <div className="text-lg font-medium text-gray-700 dark:text-gray-200 animate-fadeIn">
            Your mood analysis is ready!
          </div>
          <div className="animate-fadeIn flex flex-col gap-4 items-center mb-6">
            {(() => {
              const analysis = getAnalysisMessage();
              return (
                <div>
                  <div className="text-lg font-semibold mb-1 text-center whitespace-pre-line">
                    {analysis.msg}
                  </div>
                  {analysis.suggestion && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-blue-800 dark:text-blue-200 text-center max-w-lg">
                      💡 {analysis.suggestion}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={async () => {
                        resetInteraction();
                        setShowTip(true);
                        setTipChat([]);
                        setTipLoading(true);
                        const { avgScores, strong, weak } = analyzePERMA();
                        const perma_scores = avgScores;
                        const summary = `Strongest pillar: ${strong}, weakest pillar: ${weak}. Answers: ${JSON.stringify(answers)}. Questions: ${JSON.stringify(todaysQuestions.map(q => q.question))}`;
                        const userMessage = '';
                        let history = '';
                        try {
                          const recentSessions = await fetchRecentMoodSessions(user_id, 5);
                          history = recentSessions.map((s, i) => `Session ${recentSessions.length-i}:\nPERMA: ${JSON.stringify(s.perma_scores)}\nSummary: ${s.summary}\n`).join('\n');
                        } catch (error) {
                          console.error('Error fetching recent sessions:', error);
                        }
                        const aiResp = await getPermaTipConversation({ perma_scores, summary, userMessage, history });
                        let tipText = aiResp.response;
                        if (typeof tipText === 'string') {
                          try {
                            const parsed = JSON.parse(tipText);
                            tipText = parsed.humanized || parsed.text || parsed.response || JSON.stringify(parsed);
                          } catch (e) {}
                        } else if (typeof tipText === 'object') {
                          tipText = tipText.humanized || tipText.text || tipText.response || JSON.stringify(tipText);
                        }
                        setTipChat([{role:'ai', text: tipText || 'No response from AI.'}]);
                        setTipLoading(false);
                      }} 
                      className="px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium hover:bg-blue-200"
                    >
                      Get personalized tips
                    </button>
                    <button
                      onClick={() => {
                        setShowJournal(true);
                        setShowTip(false);
                      }}
                      className="px-3 py-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-medium hover:bg-green-200"
                    >
                      Journal about it
                    </button>
                    <button
                      onClick={() => {
                        setShowGoal(true);
                        setShowTip(false);
                      }}
                      className="px-3 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-medium hover:bg-yellow-200"
                    >
                      Set a small goal
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div>
          {step === 0 && (
            <div className="mb-6 text-lg font-medium text-gray-700 dark:text-gray-200 animate-fadeIn">
              Namaste. Let's do a quick self-check using <b>{todaysQuestions.length}</b> simple questions to understand your current state of well-being. Ready?
            </div>
          )}
          <div className="mb-4">
            <div className="flex items-center justify-center gap-4 w-full">
              <button
                className="px-3 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-xl font-bold shadow disabled:opacity-40"
                onClick={() => setVisibleStart(s => Math.max(0, s - visibleCount))}
                disabled={!canGoLeft}
                aria-label="Previous"
              >
                &larr;
              </button>
              <div className="flex flex-row w-full gap-6">
                {visibleQuestions.map((q, idx) => {
                  const realIdx = visibleStart + idx;
                  return (
                    <div
                      key={realIdx}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex-1"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                        {q.question}
                      </h3>
                      <div className="flex flex-col gap-3">
                        {q.options.map((option, optIdx) => (
                          <button
                            key={optIdx}
                            onClick={() => handleAnswer(realIdx, option.value)}
                            className={`p-3 rounded-lg text-left transition-all ${
                              answers[realIdx] === option.value
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                className="px-3 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-xl font-bold shadow disabled:opacity-40"
                onClick={() => setVisibleStart(s => Math.min(todaysQuestions.length - visibleCount, s + visibleCount))}
                disabled={!canGoRight}
                aria-label="Next"
              >
                &rarr;
              </button>
            </div>
            {allAnswered && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Submit Check-in
                </button>
              </div>
            )}
          </div>
          {showTip && (
            <div className="mt-4 w-full flex flex-col items-center">
              {tipLoading && <div className="text-blue-500 animate-pulse">PERMA AI is thinking...</div>}
              {!tipLoading && tipChat.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-4 max-w-xl w-full text-left mb-2 shadow">
                  {tipChat.map((msg, i) => (
                    <div key={i} className={msg.role === 'ai' ? 'text-blue-800 dark:text-blue-200 mb-2' : 'text-right text-gray-700 dark:text-gray-200 mb-2'}>
                      <span className="font-semibold">{msg.role === 'ai' ? 'PERMA AI: ' : 'You: '}</span>{msg.text}
                    </div>
                  ))}
                </div>
              )}
              {!tipLoading && tipChat.length > 0 && (
                <form
                  className="flex gap-2 w-full max-w-xl"
                  onSubmit={async e => {
                    e.preventDefault();
                    if (!tipInput.trim()) return;
                    setTipChat(c => [...c, {role:'user', text: tipInput}]);
                    setTipLoading(true);
                    // Send user follow-up to Groq model
                    const { avgScores, strong, weak } = analyzePERMA();
                    const perma_scores = avgScores;
                    const summary = `Strongest pillar: ${strong}, weakest pillar: ${weak}. Answers: ${JSON.stringify(answers)}. Questions: ${JSON.stringify(todaysQuestions.map(q => q.question))}`;
                    const userMessage = tipInput;
                    const history = tipChat.map(msg => `${msg.role === 'ai' ? 'Chanakya' : 'User'}: ${msg.text}`).join('\n');
                    const aiResp = await getPermaTipConversation({ perma_scores, summary, userMessage, history });
                    let tipText = aiResp.response;
                    if (typeof tipText === 'string') {
                      try {
                        const parsed = JSON.parse(tipText);
                        tipText = parsed.humanized || parsed.text || parsed.response || JSON.stringify(parsed);
                      } catch (e) {
                        // Not JSON, leave as is
                      }
                    } else if (typeof tipText === 'object') {
                      tipText = tipText.humanized || tipText.text || tipText.response || JSON.stringify(tipText);
                    }
                    setTipChat(c => [...c, {role:'ai', text: tipText || 'No response from AI.'}]);
                    setTipInput('');
                    setTipLoading(false);
                  }}
                >
                  <input
                    className="flex-1 rounded-lg border px-3 py-2 dark:bg-gray-800 dark:text-white"
                    placeholder="Say something to PERMA AI..."
                    value={tipInput}
                    onChange={e => setTipInput(e.target.value)}
                    disabled={tipLoading}
                  />
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-40" disabled={tipLoading || !tipInput.trim()}>Send</button>
                </form>
              )}
            </div>
          )}
          {showJournal && (
            <div className="mt-2 text-green-700 dark:text-green-300 text-base text-center">Journaling helps clarify thoughts and emotions. Try writing a few lines about something that made you feel good or something you'd like to improve. 🌱</div>
          )}
          {showGoal && (
            <div className="mt-2 text-yellow-700 dark:text-yellow-300 text-base text-center">Pick one tiny thing you can do today—like a 5-min walk, a gratitude note, or a deep breath break. Small steps matter! 🚶‍♂️</div>
          )}
          <div className="mt-4 text-blue-700 dark:text-blue-300 font-medium text-center">
            {getFinalEncouragement()}
          </div>
        </div>
      )}
      {!showAnalysis && (
        <div className="mb-4">
          <div className="flex items-center justify-center gap-4 w-full">
            <button
              className="px-3 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-xl font-bold shadow disabled:opacity-40"
              onClick={() => setVisibleStart(s => Math.max(0, s - visibleCount))}
              disabled={!canGoLeft}
              aria-label="Previous"
            >
              &larr;
            </button>
            <div className="flex flex-row w-full gap-6">
              {visibleQuestions.map((q, idx) => {
                const realIdx = visibleStart + idx;
                return (
                  <div
                    key={realIdx}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex-1"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                      {q.question}
                    </h3>
                    <div className="flex flex-col gap-3">
                      {q.options.map((option, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => handleAnswer(realIdx, option.value)}
                          className={`p-3 rounded-lg text-left transition-all ${
                            answers[realIdx] === option.value
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                              : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="px-3 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-xl font-bold shadow disabled:opacity-40"
              onClick={() => setVisibleStart(s => Math.min(todaysQuestions.length - visibleCount, s + visibleCount))}
              disabled={!canGoRight}
              aria-label="Next"
            >
              &rarr;
            </button>
          </div>
          {allAnswered && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleSubmit}
                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Submit Check-in
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MoodTracker;