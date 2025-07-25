import api from '../../api/axiosConfig';

// This service sends the user's PERMA scores and mood summary to the backend Groq model for a dynamic, AI-generated conversation.
export async function getPermaTipConversation({ perma_scores, summary, userMessage, history }) {
  try {
    // Get user timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('Sending user timezone to backend for PERMA chat:', userTimezone);

    const res = await api.post('/perma-chat', {
      perma_scores,
      summary,
      userMessage,
      history,
      timezone: userTimezone // Include timezone in the request
    });
    
    return res.data;
  } catch (err) {
    console.error('PERMA chat error:', err);
    return { response: 'Sorry, I was unable to connect to the AI coach. Please try again later.' };
  }
}
