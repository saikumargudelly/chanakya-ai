import API from './api';

// Save a mood session to backend
export async function saveMoodSession({ user_id, perma_scores, answers, summary }) {
  const res = await API.post('/mood-session', {
    user_id,
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
