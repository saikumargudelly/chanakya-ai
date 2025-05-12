import axios from 'axios';

// This service sends the user's PERMA scores and mood summary to the backend Groq model for a dynamic, AI-generated conversation.
export async function getPermaTipConversation({ perma_scores, summary, userMessage, history }) {
  try {
    const res = await axios.post('http://localhost:5001/perma-chat', {
      perma_scores,
      summary,
      userMessage,
      history,
    });
    return res.data;
  } catch (err) {
    return { response: 'Sorry, I was unable to connect to the AI coach. Please try again later.' };
  }
}
