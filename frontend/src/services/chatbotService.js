import api from './api';

/**
 * Ask chatbot a question
 */
export const askChatbot = async (message) => {
  try {
    const response = await api.post('/api/chatbot/ask', {
      message
    });

    return response.data;
  } catch (error) {
    console.error('Chatbot Error:', error);
    throw error;
  }
};

/**
 * Get suggested questions
 */
export const getSuggestions = async () => {
  try {
    const response = await api.get('/api/chatbot/suggestions');
    return response.data;
  } catch (error) {
    console.error('Get suggestions error:', error);
    return [];
  }
};

export default {
  askChatbot,
  getSuggestions
};
