import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getPermaTipConversation } from '../services/permaChat';
import { fetchMoodSessions, saveMoodSession, fetchRecentMoodSessions, checkDailySessionCount } from '../services/moodSession';
import { useAuth } from './AuthContext';
import ChatBubble from './ChatBubble';
import QuickReplies from './QuickReplies';

// Pool of PERMA questions for daily randomization
const PERMA_QUESTIONS = [
  // Core 5
  {
    pillar: 'Positive Emotion',
    question: 'How have your overall emotions been today?',
    options: [
      { label: '😊 Mostly positive', value: 2 },
      { label: '😐 Neutral', value: 1 },
      { label: '😟 Mostly negative', value: 0 },
    ],
  },
  {
    pillar: 'Engagement',
    question: 'Did you feel deeply involved or focused in any activity?',
    options: [
      { label: '🧠 Yes, I was fully engaged', value: 2 },
      { label: '🤷‍♂️ A bit distracted but tried', value: 1 },
      { label: '😔 Not really', value: 0 },
    ],
  },
  {
    pillar: 'Relationships',
    question: 'Have you connected with friends, family, or anyone meaningfully?',
    options: [
      { label: '❤️ Yes, very much', value: 2 },
      { label: '👥 Somewhat', value: 1 },
      { label: '🙁 No, I felt isolated', value: 0 },
    ],
  },
  {
    pillar: 'Meaning',
    question: 'Did you do something today that felt meaningful or purposeful?',
    options: [
      { label: '🌟 Yes, definitely', value: 2 },
      { label: '🤔 I\'m not sure', value: 1 },
      { label: '🕳️ No, nothing in particular', value: 0 },
    ],
  },
  {
    pillar: 'Accomplishment',
    question: 'Did you complete or make progress on any goal or task?',
    options: [
      { label: '✅ Yes, I accomplished something', value: 2 },
      { label: '📋 I started something', value: 1 },
      { label: '❌ No, I couldn\'t get to it', value: 0 },
    ],
  },
  // Additional dynamic questions for variety
  {
    pillar: 'Positive Emotion',
    question: 'Did you laugh or smile today?',
    options: [
      { label: '😂 Many times', value: 2 },
      { label: '🙂 Once or twice', value: 1 },
      { label: '😐 Not really', value: 0 },
    ],
  },
  {
    pillar: 'Engagement',
    question: 'Did you lose track of time doing something enjoyable?',
    options: [
      { label: '🎨 Yes, totally!', value: 2 },
      { label: '⏳ Briefly', value: 1 },
      { label: '🕰️ Not at all', value: 0 },
    ],
  },
  {
    pillar: 'Relationships',
    question: 'Did you help or support someone today?',
    options: [
      { label: '🤝 Yes, I did', value: 2 },
      { label: '🙂 A little', value: 1 },
      { label: '🙅‍♂️ No', value: 0 },
    ],
  },
  {
    pillar: 'Meaning',
    question: 'Did you feel your actions contributed to something bigger?',
    options: [
      { label: '🌍 Absolutely', value: 2 },
      { label: '🤔 Maybe', value: 1 },
      { label: '🙅‍♂️ Not today', value: 0 },
    ],
  },
  {
    pillar: 'Accomplishment',
    question: 'Did you overcome a challenge today?',
    options: [
      { label: '💪 Yes, I did!', value: 2 },
      { label: '🙂 A small one', value: 1 },
      { label: '🙁 Not really', value: 0 },
    ],
  },
  // More questions can be added for further daily variety
];

// Helper to get a deterministic daily set of questions
function getTodaysQuestions(questionPool, min = 5, max = 8) {
  // Use date as a seed for deterministic shuffle
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
  // Simple seeded shuffle
  let arr = [...questionPool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (seed + i * 31) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Pick a number of questions between min and max
  const numQuestions = min + (seed % (max-min+1));
  return arr.slice(0, numQuestions);
}

const PERMA_PILLARS = ['Positive Emotion', 'Engagement', 'Relationships', 'Meaning', 'Accomplishment'];

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
      const { avgScores, strong, weak } = analyzePERMA();
      const summary = `Strongest pillar: ${strong}, weakest pillar: ${weak}. Answers: ${JSON.stringify(answers)}. Questions: ${JSON.stringify(todaysQuestions.map(q => q.question))}`;
      
      const result = await saveMoodSession({
        perma_scores: avgScores,
        answers,
        summary,
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

  // Function to render historical mood analysis
  const renderHistoricalAnalysis = () => {
    if (!historicalMoods.length) return null;

    const moodEmojis = {
      'Positive Emotion': '😊',
      'Engagement': '🧠',
      'Relationships': '❤️',
      'Meaning': '🌟',
      'Accomplishment': '🏆',
    };

    // Calculate average scores for each pillar
    const averageScores = {};
    PERMA_PILLARS.forEach(pillar => {
      const scores = historicalMoods.map(session => session.perma_scores[pillar] || 0);
      averageScores[pillar] = scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    // Get date range
    const startDate = new Date(historicalMoods[historicalMoods.length - 1].timestamp);
    const endDate = new Date(historicalMoods[0].timestamp);
    const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    return (
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3">
          Your PERMA Results (Last 5 Days)
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">
            {dateRange}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(averageScores).map(([pillar, score]) => (
              <div key={pillar} className="flex items-center gap-3">
                <span className="text-2xl">{moodEmojis[pillar]}</span>
                <span className="font-semibold w-32 inline-block text-gray-700 dark:text-gray-200">{pillar}</span>
                <div className="flex-1">
                  <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-4 rounded-full transition-all duration-700 bg-blue-400"
                      style={{ width: `${Math.round(score * 50)}%`, minWidth: '8%' }}
                    />
                  </div>
                </div>
                <span className="ml-2 font-bold text-lg">{score.toFixed(2)}</span>
              </div>
            ))}
          </div>
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
    todaysQuestions.forEach((q, i) => {
      pillarScores[q.pillar].push(answers[i]);
    });
    // Average each pillar
    let avgScores = {};
    PERMA_PILLARS.forEach(p => {
      avgScores[p] = pillarScores[p].length ? (pillarScores[p].reduce((a,b) => a+b, 0) / pillarScores[p].length) : 0;
    });
    // Find strong and weak
    const sorted = Object.entries(avgScores).sort((a,b) => b[1]-a[1]);
    const strong = sorted[0][0];
    const weak = sorted[sorted.length-1][0];
    return { avgScores, strong, weak };
  }

  function getAnalysisMessage() {
    const { avgScores, strong, weak } = analyzePERMA();
    // Empathetic, natural response
    let msg = `From your answers, I see strong *${strong}*`;
    // If strong and weak are different, mention both
    if (strong !== weak) {
      msg += `, but a little dip in *${weak}*.`;
    }
    // Suggestion based on weak pillar
    let suggestion = '';
    switch (weak) {
      case 'Relationships':
        suggestion = 'Perhaps a quick call to a friend could help you feel more connected today.';
        break;
      case 'Meaning':
        suggestion = 'Maybe try a small act of kindness or reflect on what matters to you.';
        break;
      case 'Engagement':
        suggestion = 'Consider immersing yourself in a favorite hobby, even for a few minutes.';
        break;
      case 'Accomplishment':
        suggestion = 'Try setting a tiny goal and celebrating its completion.';
        break;
      case 'Positive Emotion':
        suggestion = 'How about listening to a favorite song or stepping outside for fresh air?';
        break;
      default:
        suggestion = 'Would you like a suggestion for something meaningful to do?';
    }
    // Add a friendly greeting to the start
    const intro = "Hey! Here's what I noticed from your check-in today: ";
    return `${intro}${msg} ${suggestion}`;
  }

  function getFinalEncouragement() {
    return `Small actions create big ripples, my friend. You've already taken the first one — self-reflection. Shall we try another quick goal or journal?`;
  }

  function getDynamicTip(weak) {
    switch (weak) {
      case 'Relationships':
        return "Reach out to someone you care about—even a short message can brighten both your days. Try a quick call or a kind text.";
      case 'Meaning':
        return "Reflect on what gives you purpose. Even a small act, like helping someone or learning something new, can add meaning to your day.";
      case 'Engagement':
        return "Try to immerse yourself in a favorite activity, even for just 5 minutes. Flow moments boost engagement and joy.";
      case 'Accomplishment':
        return "Set a tiny, achievable goal for today—like tidying your desk or finishing a small task. Celebrate your progress!";
      case 'Positive Emotion':
        return "Pause for a moment of gratitude or enjoy something simple—a song, a walk, or a deep breath. Positive feelings grow with attention.";
      default:
        return "Would you like a suggestion for something meaningful to do?";
    }
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
                           style={{ width: `${Math.round(score * 50)}%`, minWidth: '8%' }}>
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
    <div className="p-6 text-gray-800 dark:text-white">
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 tracking-tight flex items-center gap-2 mb-3">
        <span>🧘‍♂️</span> Mood Tracker
      </h2>
      {step === 0 && !showAnalysis && (
        <div className="mb-6 text-lg font-medium text-gray-700 dark:text-gray-200 animate-fadeIn">
          Namaste. Let's do a quick self-check using <b>{todaysQuestions.length}</b> simple questions to understand your current state of well-being. Ready?
        </div>
      )}
      {showAnalysis && (
        <div className="animate-fadeIn flex flex-col gap-4 items-center">
          <div className="text-lg font-semibold mb-1 text-center">
            {getAnalysisMessage()}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={async ()=>{
                resetInteraction();
                setShowTip(true);
                setTipChat([]);
                setTipLoading(true);
                const { avgScores, strong, weak } = analyzePERMA();
                const perma_scores = avgScores;
                const summary = `Strongest pillar: ${strong}, weakest pillar: ${weak}. Answers: ${JSON.stringify(answers)}. Questions: ${JSON.stringify(todaysQuestions.map(q => q.question))}`;
                const userMessage = '';
                // Fetch recent sessions for richer context
                let history = '';
                try {
                  const recentSessions = await fetchRecentMoodSessions(user_id, 5);
                  history = recentSessions.map((s, i) => `Session ${recentSessions.length-i}:\nPERMA: ${JSON.stringify(s.perma_scores)}\nSummary: ${s.summary}\n`).join('\n');
                } catch {}
                const aiResp = await getPermaTipConversation({ perma_scores, summary, userMessage, history });
                let tipText = aiResp.response;
                // Robustly parse if tipText is a stringified JSON or object
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
                setTipLoading(false);
              }}
              className="px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium hover:bg-blue-200"
            >
              Give me a tip
            </button>
            <button onClick={()=>{resetInteraction();setShowJournal(true);}} className="px-3 py-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-medium hover:bg-green-200">Start a journal</button>
            <button onClick={()=>{resetInteraction();setShowGoal(true);}} className="px-3 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-medium hover:bg-yellow-200">Set a small goal</button>
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
                    className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex-1`}
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