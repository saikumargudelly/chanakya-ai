import API from './api';
import axios from 'axios';

// Save a mood session to backend
// Helper function to validate PERMA scores
const validatePermaScores = (scores) => {
  const requiredScores = [
    'Positive Emotion', 'Engagement', 'Relationships', 
    'Meaning', 'Accomplishment', 'overall'
  ];
  
  const validated = {};
  for (const key of requiredScores) {
    const value = scores[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing required PERMA score: ${key}`);
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 10) {
      throw new Error(`Invalid PERMA score for ${key}: ${value}. Must be between 0 and 10`);
    }
    validated[key.toLowerCase().replace(' ', '_')] = numValue;
  }
  return validated;
};

// Test endpoint to verify backend connectivity
export async function testBackendConnection() {
  try {
    const response = await axios.get('http://localhost:5001/health');
    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    console.error('Backend connection test failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw error;
  }
}

export async function saveMoodSession({ user_id, perma_scores, answers, summary, timestamp }) {
  try {
    console.log('Starting saveMoodSession with:', { user_id, perma_scores, answers, summary, timestamp });
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    // Validate user_id
    const userId = parseInt(user_id, 10);
    if (isNaN(userId) || userId <= 0) {
      throw new Error('Invalid user ID');
    }

    // Validate and transform PERMA scores
    const validatedScores = validatePermaScores(perma_scores);
    
    // Validate answers
    if (!Array.isArray(answers) || answers.length === 0) {
      throw new Error('Answers array is required');
    }

    const requestData = {
      user_id: userId,
      perma_scores: validatedScores,
      answers: answers.map(a => ({
        question: String(a.question || ''),
        pillar: String(a.pillar || ''),
        score: parseFloat(a.score) || 0,
        answer: String(a.answer || '')
      })),
      summary: String(summary || ''),
      timestamp: timestamp || new Date().toISOString()
    };

    console.log('Submitting mood session with data:', JSON.stringify(requestData, null, 2));

    // First, test the backend connection
    console.log('Testing backend connection...');
    try {
      const healthCheck = await testBackendConnection();
      console.log('Backend health check successful:', healthCheck);
    } catch (error) {
      console.error('Backend health check failed:', error);
      throw new Error('Unable to connect to the server. Please check your connection and try again.');
    }

    // Then proceed with the actual request
    console.log('Sending mood session data...');
    const res = await API.post('/mood-session', requestData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      validateStatus: (status) => status < 600, // Handle all status codes
      timeout: 10000 // 10 second timeout
    }).catch(error => {
      console.error('Request failed:', {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response?.data
      });
      throw error;
    });

    console.log('Mood session response:', {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      data: res.data
    });

    // Log the complete error response for debugging
    if (res.status >= 400) {
      console.error('Server responded with error:', {
        status: res.status,
        statusText: res.statusText,
        data: res.data,
        headers: res.headers,
        config: {
          url: res.config?.url,
          method: res.config?.method,
          headers: res.config?.headers
        }
      });
      
      // Try to get more detailed error information
      const errorData = res.data || {};
      const errorInfo = {
        status: res.status,
        statusText: res.statusText,
        data: errorData,
        error: errorData.error || errorData.message || 'No error details provided',
        stack: errorData.stack,
        validationErrors: errorData.errors,
        request: {
          url: res.config?.url,
          method: res.config?.method,
          data: res.config?.data ? JSON.parse(res.config.data) : null
        }
      };
      
      console.error('API Error Response:', JSON.stringify(errorInfo, null, 2));
      
      let errorMessage = `Request failed with status ${res.status}`;
      if (res.status === 500) {
        // Try to get the actual error message from the response
        const serverError = errorData.error || errorData.message || 'Internal server error';
        errorMessage = `Server error: ${serverError}`;
        
        // Log additional debugging info
        console.error('Server error details:', {
          error: serverError,
          stack: errorData.stack,
          validationErrors: errorData.errors,
          requestData: requestData
        });
      } else if (errorData.detail) {
        errorMessage = Array.isArray(errorData.detail) 
          ? errorData.detail.map(err => err.msg || JSON.stringify(err)).join(', ')
          : String(errorData.detail);
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      const error = new Error(errorMessage);
      error.response = res;
      error.request = res.request;
      error.config = res.config;
      throw error;
    }

    return res.data;
  } catch (error) {
    console.error('Error in saveMoodSession:', {
      error: error.toString(),
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      request: error.request,
      config: error.config
    });
    throw error; // Re-throw to be handled by the caller
  }
}

// Fetch mood sessions for a user and (optionally) a date (YYYY-MM-DD)
export async function fetchMoodSessions(user_id, date = null) {
  const params = { user_id };
  if (date) params.date = date;
  const res = await API.get('/mood-session', { params });
  return res.data;
}

// Fetch the latest N sessions for a user (for PERMA chat context)
export async function fetchRecentMoodSessions(user_id, limit = 5) {
  const params = { user_id };
  const res = await API.get('/mood-session', { params });
  // Sort by timestamp desc, take latest N
  const sorted = res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return sorted.slice(0, limit);
}

// Check daily session count and next available check-in time
export async function checkDailySessionCount() {
  const res = await API.get('/mood-session/daily-count');
  return res.data;
}

/**
 * Get AI-powered conversation based on PERMA scores
 * @param {Object} params - The parameters for the conversation
 * @param {Object} params.perma_scores - The PERMA scores
 * @param {string} [params.summary=''] - Summary of the PERMA analysis
 * @param {string} [params.userMessage=''] - User's message to the AI coach
 * @param {Array} [params.history=[]] - Chat history array of {role, content} objects
 * @param {string} [params.timezone='UTC'] - User's timezone
 * @param {Object} [params.trends={}] - PERMA score trends
 * @returns {Promise<{message: string, error?: boolean, details?: Object}>} Response from the AI coach
 */
export const getPermaTipConversation = async ({
  perma_scores = {},
  summary = '',
  userMessage = '',
  history = [],
  timezone = 'UTC',
  trends = {}
}) => {
  try {
    // Ensure we have required parameters
    if (!perma_scores || Object.keys(perma_scores).length === 0) {
      throw new Error('PERMA scores are required');
    }

    // Convert history array to a formatted string
    const formatHistory = (messages) => {
      if (!Array.isArray(messages)) return String(messages);
      return messages
        .map(msg => `[${msg.role || 'user'}] ${msg.content || ''}`.trim())
        .filter(Boolean)
        .join('\n');
    };

    // Prepare the request payload matching backend expectations
    const payload = {
      userMessage,
      perma_scores,
      summary: summary || `Overall wellbeing: ${calculateAverageScore(perma_scores).toFixed(1)}/10`,
      history: formatHistory(history),
      timezone,
      trends
    };

    console.log('Sending to /api/perma-chat:', JSON.stringify(payload, null, 2));

    const response = await API.post('/perma-chat', payload);
    
    // Ensure consistent response format
    return {
      message: response.data?.response || 'How can I help you improve your wellbeing today?',
      ...response.data
    };
  } catch (error) {
    console.error('Error in getPermaTipConversation:', {
      error: error.response?.data || error.message,
      status: error.response?.status,
      stack: error.stack
    });
    
    // Return a helpful error message
    return {
      message: 'Sorry, I encountered an error. Please try again later.',
      error: true,
      details: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      }
    };
  }
};

// Helper function to calculate average PERMA score
function calculateAverageScore(scores) {
  if (!scores) return 0;
  const values = Object.values(scores).filter(Number.isFinite);
  return values.length > 0 
    ? values.reduce((sum, score) => sum + score, 0) / values.length 
    : 0;
}