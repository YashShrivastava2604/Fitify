const express = require('express');
const router = express.Router();
const { verifyClerkToken, requireOnboarding } = require('../middleware/clerkAuth.middleware');
const {
  getUserProfile,
  completeOnboarding,
  updateUserProfile,
  getUserStats,
} = require('../controllers/user.controller');

// Get user profile (requires auth)
// GET /api/user/profile
router.get('/profile', , getUserProfile);

// Complete onboarding
// POST /api/user/onboarding
router.post('/onboarding', , completeOnboarding);

// Update user profile (requires onboarding completed)
// PUT /api/user/profile
router.put('/profile', requireOnboarding, updateUserProfile);

// Get user statistics
// GET /api/user/stats
router.get('/stats', requireOnboarding, getUserStats);

module.exports = router;