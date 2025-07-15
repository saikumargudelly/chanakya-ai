import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PERMA_PILLARS, PERMA_QUESTIONS, PERMA_DESCRIPTIONS } from '../../constants/permaConstants';
import { motion, AnimatePresence, AnimatePresence as MotionAnimatePresence } from 'framer-motion';
import MoodSelector from '../../components/wellness/MoodSelector';
import { 
  FiCheck, 
  FiChevronLeft, 
  FiChevronRight, 
  FiSend,
  FiRefreshCw,
  FiMessageSquare,
  FiX
} from 'react-icons/fi';
import { 
  analyzePERMA,
  getScoreEmoji,
  getScoreDescription,
  getTodaysQuestions,
  getPillarDescription
} from '../../utils/permaUtils';
import { 
  saveMoodSession, 
  fetchRecentMoodSessions,
  getPermaTipConversation
} from '../../services/mood/permaService';
import { getMoodFromPermaScores } from '../../services/mood/moodSession';
import { checkBackendHealth } from '../../services/api/healthService';
import { useQuery } from '@tanstack/react-query';
import VirtualList from '../../components/common/VirtualList';
import { withMemoization } from '../../utils/withMemoization';
import OptimizedImage from '../../components/common/OptimizedImage';
import Sidebar from '../../components/layout/Sidebar';
import TopNav from '../../components/layout/TopNav';
import Profile from '../../components/common/Profile';

// Helper functions
const getWeakestPillar = (scores) => {
  if (!scores) return '';
  const entries = Object.entries(scores).filter(([key]) => key !== 'overall');
  return entries.length > 0 ? entries.reduce((a, b) => a[1] < b[1] ? a : b)[0] : '';
};

const getStrongestPillar = (scores) => {
  if (!scores) return '';
  const entries = Object.entries(scores);
  return entries.length > 0 ? entries.reduce((a, b) => a[1] > b[1] ? a : b)[0] : '';
};

const calculateAverageScore = (scores) => {
  if (!scores) return 0;
  const values = Object.values(scores);
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const MoodTracker = () => {
  // State management
  const [answers, setAnswers] = useState([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [permaScores, setPermaScores] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [showProfile, setShowProfile] = useState(false);
  
  // Get user data
  const { user } = useAuth();
  const user_id = user?.id || null;
  
  // Get today's questions using the utility function
  const todaysQuestions = useMemo(() => {
    return getTodaysQuestions(PERMA_QUESTIONS);
  }, []);
  
  // Refs
  const chatEndRef = useRef(null);
  
  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);
  
  // Initialize chat with AI based on PERMA scores
  const initializeChat = useCallback(async (scores) => {
    // Skip if we don't have valid scores
    if (!scores || Object.keys(scores).length === 0) {
      console.log('Skipping chat initialization: No scores provided');
      return;
    }

    try {
      setIsChatLoading(true);
      
      console.log('Initializing chat with scores:', scores);
      
      const response = await getPermaTipConversation({
        perma_scores: scores.avgScores || scores, // Handle both analysis object and plain scores
        summary: scores.summary || `Overall wellbeing: ${calculateAverageScore(scores.avgScores || scores).toFixed(1)}/10`,
        history: [], // Don't pass moodHistory here to prevent re-renders
        userMessage: 'Hello, I just completed my PERMA check-in.'
      });
      
      console.log('Chat initialization response:', response);
      
      // Handle the response structure from the updated service
      const assistantMessage = response.message || response.response || 
        "I've analyzed your PERMA scores. How can I help you improve your wellbeing today?";
      
      setChatHistory([
        { role: 'assistant', content: assistantMessage }
      ]);
    } catch (err) {
      console.error('Error initializing chat:', {
        error: err,
        message: err.message,
        response: err.response?.data
      });
      
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error initializing the chat. Please try again.' 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  }, []); // Removed moodHistory from dependencies to prevent loops
  
  const currentQuestion = todaysQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === todaysQuestions.length - 1;
  
  // Initialize answers array
  useEffect(() => {
    if (todaysQuestions.length > 0 && answers.length === 0) {
      setAnswers(Array(todaysQuestions.length).fill(null));
    }
  }, [todaysQuestions.length]);
  
  // Check if user has reached daily submission limit and get today's submissions
  const checkDailyLimit = useCallback(async () => {
    if (!user_id) return { hasReachedLimit: false, todaysSubmissions: [] };
    
    try {
      const response = await fetchRecentMoodSessions(user_id, 10); // Get recent submissions
      // Filter submissions from today
      const today = new Date().toISOString().split('T')[0];
      const todaysSubmissions = response.filter(session => 
        session.timestamp && session.timestamp.startsWith(today)
      );
      return { 
        hasReachedLimit: todaysSubmissions.length >= 2,
        todaysSubmissions
      };
    } catch (error) {
      console.error('Error checking daily limit:', error);
      return { hasReachedLimit: false, todaysSubmissions: [] };
    }
  }, [user_id]);

  // Handle showing daily limit reached
  const showDailyLimitReached = useCallback((latestSubmission) => {
    if (!latestSubmission?.perma_scores) return;
    
    setShowAnalysis(true);
    setPermaScores(latestSubmission.perma_scores);
    
    // Initialize chat with the latest submission data
    initializeChat({
      avgScores: latestSubmission.perma_scores,
      summary: latestSubmission.summary || 'Your PERMA analysis',
      weak: getWeakestPillar(latestSubmission.perma_scores)
    });
    
    setError('You have already completed your 2 mood check-ins for today. Here\'s your most recent PERMA summary:');
  }, [initializeChat]);

  // Fetch mood history and check daily limit on component mount
  useEffect(() => {
    const checkLimitAndInitialize = async () => {
      if (!user_id) return;
      
      try {
        setIsLoading(true);
        // First check the daily limit and get today's submissions
        const { hasReachedLimit, todaysSubmissions } = await checkDailyLimit();
        
        // If limit reached, show the latest submission
        if (hasReachedLimit && todaysSubmissions.length > 0) {
          showDailyLimitReached(todaysSubmissions[0]);
        }
        
        // Always fetch and set mood history for other functionality
        const history = await fetchRecentMoodSessions(user_id, 5);
        setMoodHistory(history);
        
      } catch (err) {
        console.error('Error in initial data load:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkLimitAndInitialize();
  }, [user_id, checkDailyLimit, showDailyLimitReached]);
  


  // Handle answer selection with animation
  const handleAnswer = useCallback((questionIndex, value) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
    
    // Auto-advance to next question if not the last one
    if (questionIndex < todaysQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => Math.min(prev + 1, todaysQuestions.length - 1));
      }, 500); // Slightly longer delay for smoother transition
    } else {
      // Show celebration effect on last answer
      setTimeout(() => {
        // You can add a celebration effect here
      }, 300);
    }
  }, [answers, todaysQuestions.length]);
  
  // Handle chat message submission
  const handleChatSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const message = userMessage.trim();
    if (!message || isChatLoading) return;
    
    // Add user message to chat immediately
    const userMsg = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMsg]);
    setUserMessage('');
    setIsChatLoading(true);
    
    try {
      console.log('Sending chat message with scores:', permaScores);
      
      const response = await getPermaTipConversation({
        perma_scores: permaScores?.avgScores || permaScores || {},
        summary: permaScores?.summary || `Overall wellbeing: ${calculateAverageScore(permaScores?.avgScores || permaScores || {}).toFixed(1)}/10`,
        history: chatHistory.slice(-5), // Only send last 5 messages for context
        userMessage: message,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      console.log('Chat response received:', response);
      
      // Handle the response structure from the updated service
      const assistantMessage = response.message || response.response || 
        "I'm here to help you with your wellbeing. What would you like to know?";
      
      // Only update if we got a valid response
      if (assistantMessage) {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: assistantMessage 
        }]);
      }
    } catch (err) {
      console.error('Error in handleChatSubmit:', {
        error: err,
        message: err.message,
        response: err.response?.data
      });
      
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again later.' 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [userMessage, isChatLoading, permaScores, chatHistory]);
  
  // Handle form submission
  const testBackendConnection = async () => {
    try {
      await fetch('/health');
      return true;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  };

  const checkServerHealth = useCallback(async () => {
    try {
      console.log('Checking backend health...');
      const health = await checkBackendHealth();
      console.log('Backend health response:', health);
      
      if (!health?.isHealthy) {
        console.error('Backend health check failed:', health?.error || 'Unknown error');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking backend health:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      return false;
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    setError('');
    setIsLoading(true);

    // Check if user has reached daily limit
    const { hasReachedLimit, todaysSubmissions } = await checkDailyLimit();
    if (hasReachedLimit) {
      setError('You have already completed your 2 mood check-ins for today.');
      if (todaysSubmissions.length > 0) {
        showDailyLimitReached(todaysSubmissions[0]);
      }
      setIsLoading(false);
      return;
    }

    // Check backend health
    const isHealthy = await checkServerHealth();
    if (!isHealthy) {
      setError('Unable to connect to the server. Please check your internet connection and try again.');
      setIsLoading(false);
      return;
    }

    // Validate all questions are answered
    if (answers.some(a => a === null)) {
      setError('Please answer all questions before submitting');
      setIsLoading(false);
      return;
    }

    // Format answers and calculate analysis before try-catch
    const formattedAnswers = answers.map(answer => {
      // If answer is already in 0-2 scale, return as is
      if (answer >= 0 && answer <= 2) return answer;
      // If answer is in 0-10 scale, convert to 0-2 scale (rounding to nearest integer)
      if (answer >= 0 && answer <= 10) return Math.round((answer / 10) * 2);
      // Default to 1 if value is invalid
      return 1;
    });
    
    // Calculate PERMA scores with properly formatted answers
    const analysis = analyzePERMA(formattedAnswers, todaysQuestions, PERMA_PILLARS);
    setPermaScores(analysis);
    
    // Format perma_scores for backend (flatten the structure)
    const permaScoresForBackend = {
      ...analysis.avgScores,
      overall: analysis.overallScore
    };
    
    // Calculate average score for display
    const avgScore = analysis.overallScore;
    
    try {
      // Log all questions and answers for debugging
      console.log('All questions:', todaysQuestions);
      console.log('All formattedAnswers:', formattedAnswers);

      // Calculate overall PERMA score
      const permaScoreValues = Object.values(permaScoresForBackend);
      const overallScore = permaScoreValues.length > 0
        ? permaScoreValues.reduce((sum, val) => sum + val, 0) / permaScoreValues.length
        : 0;

      // Calculate mood from PERMA scores using shared utility
      const mood = getMoodFromPermaScores(permaScoresForBackend);
      console.log('Derived mood from PERMA score:', { permaScoresForBackend, mood });

      // Prepare answers for submission
      const answerData = todaysQuestions.map((q, i) => ({
        question: q.question,
        pillar: q.pillar,
        score: formattedAnswers[i],
        answer: q.options.find(o => o.value === formattedAnswers[i])?.label || ''
      }));

      // Save to backend if user is logged in
      if (user_id) {
        const sessionData = {
          user_id,
          mood,
          perma_scores: permaScoresForBackend,
          answers: answerData,
          summary: `Overall wellbeing: ${avgScore.toFixed(1)}/10`,
          timestamp: new Date().toISOString()
        };
        
        console.log('Saving mood session:', sessionData);
        await saveMoodSession(sessionData);
      }
      
      setShowAnalysis(true);
      initializeChat(analysis);
    } catch (err) {
      console.error('Error in handleSubmit:', {
        error: err,
        message: err.message,
        stack: err.stack,
        response: err.response?.data,
        code: err.code,
        config: err.config
      });
      
      let errorMessage = 'Failed to submit your responses. Please try again.';
      
      // Handle specific error cases
      if (err.response?.data?.detail?.includes('Daily limit of 2 mood sessions reached')) {
        errorMessage = 'You have already submitted your mood check-in for today. Here\'s your PERMA summary:';
        // Show the analysis with the current answers since they were valid but hit the limit
        setShowAnalysis(true);
        initializeChat(analysis);
        
        // Also fetch and show previous submissions
        try {
          const response = await fetchRecentMoodSessions(1); // Get today's submissions
          if (response && response.length > 0) {
            // Show the most recent submission
            const latest = response[0];
            // Only update if we don't have the current analysis
            if (!analysis) {
              setPermaScores(latest.perma_scores);
              initializeChat({
                avgScores: latest.perma_scores,
                summary: latest.summary || 'Your PERMA analysis',
                weak: getWeakestPillar(latest.perma_scores)
              });
            }
          }
        } catch (fetchError) {
          console.error('Error fetching previous submissions:', fetchError);
        }
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.response) {
        // Server responded with an error
        const { status, data } = err.response;
        console.error('Server error details:', {
          status,
          statusText: err.response.statusText,
          data,
          headers: err.response.headers
        });
        
        if (status === 400 && data?.detail) {
          errorMessage = data.detail;
        } else if (status >= 500) {
          errorMessage = 'Our server is currently experiencing issues. Please try again in a few minutes.';
          // Log detailed error for debugging
          console.error('Server error details:', {
            error: data?.error || data?.message || 'Unknown server error',
            validationErrors: data?.errors,
            stack: data?.stack
          });
        } else if (status === 401) {
          errorMessage = 'Please log in to save your mood session.';
        } else if (status === 422) {
          errorMessage = 'Invalid data format. Please try again.';
        } else if (data?.detail) {
          errorMessage = typeof data.detail === 'string' 
            ? data.detail 
            : 'Validation error occurred';
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      } else if (err.message) {
        // Other errors
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [answers, todaysQuestions, user_id, initializeChat]);
  
  // Render a single PERMA pillar score card
  const renderPillarScore = (pillar, score) => {
    const emoji = getScoreEmoji(score);
    const description = getPillarDescription(pillar, score, PERMA_DESCRIPTIONS);
    const percentage = Math.round((score / 10) * 100);
    
    return (
      <div key={pillar} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 dark:text-white">{pillar}</h4>
          <span className="text-2xl">{emoji}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {description}
        </p>
      </div>
    );
  };
  
  // Render the analysis results with enhanced UI
  const renderAnalysis = () => {
    if (!permaScores) return null;
    // Use avgScores if present, else fallback to permaScores
    const scores = permaScores.avgScores || permaScores;
    const averageScore = calculateAverageScore(scores);
    const strongestPillar = getStrongestPillar(scores);
    const weakestPillar = getWeakestPillar(scores);
    const scoreEntries = Object.entries(scores);
    
    return (
      <motion.div 
        className="space-y-8 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Your Wellbeing Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Here's how you're doing across the PERMA wellbeing dimensions
          </p>
        </motion.div>
        
        {/* Overall Score Card */}
        <motion.div 
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-6 shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-1">Overall Wellbeing Score</h3>
              <p className="text-indigo-100">Based on your PERMA dimensions</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="text-5xl font-bold">{averageScore.toFixed(1)}<span className="text-2xl text-indigo-200">/10</span></div>
            </div>
          </div>
          <div className="mt-6 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <p className="text-sm">
              Your strongest area is <span className="font-semibold">{strongestPillar.replace('_', ' ')}</span> and 
              you might want to focus on improving <span className="font-semibold">{weakestPillar.replace('_', ' ')}</span>.
            </p>
          </div>
        </motion.div>
        
        {/* PERMA Pillars Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                delayChildren: 0.4,
                staggerChildren: 0.1
              }
            }
          }}
        >
          {scoreEntries.map(([pillar, score]) => (
            <motion.div
              key={pillar}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { 
                  y: 0, 
                  opacity: 1,
                  transition: {
                    type: 'spring',
                    stiffness: 100,
                    damping: 10
                  }
                }
              }}
            >
              {renderPillarScore(pillar, score)}
            </motion.div>
          ))}
        </motion.div>
        
        {/* Action Card */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Need help improving your wellbeing?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Chat with our wellbeing assistant for personalized tips and guidance.
              </p>
            </div>
            <motion.button
              onClick={() => setShowChat(true)}
              className="mt-4 md:mt-0 inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiMessageSquare className="mr-2" />
              Chat with Wellbeing Assistant
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };
  
  // Render the current question with enhanced UI
  const renderQuestion = () => {
    if (!currentQuestion) return null;
    
    const isMoodQuestion = currentQuestion.question.toLowerCase().includes('how are you feeling');
    const progress = ((currentQuestionIndex + 1) / todaysQuestions.length) * 100;
    
    return (
      <div className="relative">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        <MotionAnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="inline-block px-3 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                {currentQuestion.pillar.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentQuestionIndex + 1} of {todaysQuestions.length}
              </span>
            </div>
            
            <motion.h3 
              className="text-xl font-semibold text-gray-900 dark:text-white mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {currentQuestion.question}
            </motion.h3>
            
            {isMoodQuestion ? (
              <MoodSelector 
                selectedValue={answers[currentQuestionIndex]} 
                onSelect={(value) => handleAnswer(currentQuestionIndex, value)} 
              />
            ) : (
        
              <motion.div 
                className="space-y-3 mb-6"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
                initial="hidden"
                animate="show"
              >
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          type: 'spring',
                          stiffness: 300,
                          damping: 20
                        }
                      }
                    }}
                    onClick={() => handleAnswer(currentQuestionIndex, option.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      answers[currentQuestionIndex] === option.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:shadow-sm'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center">
                      <motion.div 
                        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mr-3 ${
                          answers[currentQuestionIndex] === option.value
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        layoutId={`option-${currentQuestionIndex}-${index}`}
                      >
                        {answers[currentQuestionIndex] === option.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            <FiCheck size={14} />
                          </motion.div>
                        )}
                      </motion.div>
                      <span>{option.label}</span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        </MotionAnimatePresence>
        
        <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <motion.button
            type="button"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className={`px-4 py-2 rounded-lg flex items-center ${
              currentQuestionIndex === 0
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
            }`}
          >
            <FiChevronLeft className="mr-1" /> Previous
          </motion.button>
          
          {isLastQuestion ? (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || answers.some(a => a === null)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <FiRefreshCw className="animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                'See Results'
              )}
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              disabled={answers[currentQuestionIndex] === null || answers[currentQuestionIndex] === undefined}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Next <FiChevronRight className="ml-1" />
            </motion.button>
          )}
        </div>
      </div>
    );
  };
  
  // Render chat interface with enhanced UI
  const renderChat = () => {
    if (!showChat) return null;
    
    return (
      <motion.div 
        className="mt-8 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <FiMessageSquare className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Wellbeing Assistant</h3>
                <p className="text-xs text-indigo-100">Here to help you improve</p>
              </div>
            </div>
            <button 
              onClick={() => setShowChat(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div 
          className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50"
          ref={chatEndRef}
        >
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                <FiMessageSquare className="w-8 h-8 text-indigo-500" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">How can I help you today?</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
                Ask me anything about your wellbeing, or get personalized tips based on your PERMA scores.
              </p>
            </div>
          ) : (
            chatHistory.map((msg, i) => (
              <motion.div 
                key={i}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div 
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))
          )}
          
          {isChatLoading && (
            <motion.div 
              className="flex justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Chat Input */}
        <form 
          onSubmit={handleChatSubmit} 
          className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <div className="relative">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={isChatLoading}
              aria-label="Type your message"
            />
            <button
              type="submit"
              disabled={!userMessage.trim() || isChatLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Ask about your wellbeing, mood, or get personalized tips
          </p>
        </form>
      </motion.div>
    );
  };
  
  // Render error message
  const renderError = () => {
    if (!error) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg"
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <TopNav setShowProfile={setShowProfile} />
        {showProfile && <Profile onClose={() => setShowProfile(false)} />}
        <main className="flex-1 p-6 md:p-10 bg-gray-950">
          <div className="w-full max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 w-full"
            >
              <div className="w-full">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Wellbeing Check-in
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Answer a few questions to track your PERMA wellbeing dimensions
                </p>
              </div>
              
              {error && renderError()}
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 w-full">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <FiRefreshCw className="animate-spin text-indigo-600 dark:text-indigo-400 text-2xl" />
                  </div>
                ) : showAnalysis ? (
                  <div className="space-y-6">
                    {renderAnalysis()}
                    {renderChat()}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setShowAnalysis(false);
                          setCurrentQuestionIndex(0);
                          setAnswers(Array(todaysQuestions.length).fill(null));
                          setShowChat(false);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center text-sm font-medium"
                      >
                        <FiRefreshCw className="mr-2" /> Start a new check-in
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {renderQuestion()}
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MoodTracker;
