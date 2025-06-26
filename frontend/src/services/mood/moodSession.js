import API from './api';

// Save a mood session to backend
export async function saveMoodSession({ perma_scores, answers, summary }) {
  const res = await API.post('/mood-session', {
    perma_scores,
    answers,
    summary,
  });
  return res.data;
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

// Utility: Map overall PERMA score to mood label
export function getMoodLabelFromScore(score) {
  if (score >= 1.6) return '😊 Very happy';
  if (score >= 1.2) return '🙂 Good';
  if (score >= 0.8) return '😐 Neutral';
  if (score >= 0.4) return '😕 A bit down';
  return '😞 Very low';
}

// Utility: Calculate overall score from perma_scores and return mood label
export function getMoodFromPermaScores(perma_scores) {
  const values = Object.values(perma_scores);
  const overallScore = values.length > 0
    ? values.reduce((sum, val) => sum + val, 0) / values.length
    : 0;
  return getMoodLabelFromScore(overallScore);
}
