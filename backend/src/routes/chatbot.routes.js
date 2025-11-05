const express = require('express');
const router = express.Router();
const { verifyClerkToken } = require('../middleware/clerkAuth.middleware');
const { askChatbot, getSuggestions } = require('../controllers/chatbot.controller');

// Ask chatbot a question
// POST /api/chatbot/ask
router.post('/ask', verifyClerkToken, askChatbot);

// Get suggested questions
// GET /api/chatbot/suggestions
router.get('/suggestions', verifyClerkToken, getSuggestions);

module.exports = router;
