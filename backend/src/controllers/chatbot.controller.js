const { getChatbotResponse } = require('../services/chatbotService');
const { successResponse, errorResponse } = require('../utils/responses');

/**
 * Chat with nutrition AI assistant
 * POST /api/chatbot/ask
 */
const askChatbot = async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.auth.user;

    if (!message || message.trim().length === 0) {
      return errorResponse(res, 400, 'Message is required');
    }

    console.log(`💬 Chatbot question from ${user.email}: "${message}"`);

    // User context for personalized responses
    const context = {
      goal: user.goal,
      dailyCalorieTarget: user.dailyCalorieTarget,
      currentWeight: user.currentWeight
    };

    const result = await getChatbotResponse(message, context);

    if (!result.success) {
      return errorResponse(res, 500, 'Chatbot unavailable');
    }

    return successResponse(res, 200, 'Response generated', {
      question: message,
      answer: result.message,
      source: result.source
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return errorResponse(res, 500, 'Chatbot error', error.message);
  }
};

/**
 * Get suggested questions
 * GET /api/chatbot/suggestions
 */
const getSuggestions = async (req, res) => {
  const suggestions = [
    "What's a healthy breakfast for weight loss?",
    "How much protein should I eat daily?",
    "Is paneer good for muscle gain?",
    "Best post-workout meal?",
    "How to reduce sugar cravings?",
    "Nutrition info for biryani?",
    "Healthy Indian snack options?",
    "How many calories in one roti?"
  ];

  return successResponse(res, 200, 'Suggestions fetched', {
    suggestions
  });
};

module.exports = {
  askChatbot,
  getSuggestions
};
