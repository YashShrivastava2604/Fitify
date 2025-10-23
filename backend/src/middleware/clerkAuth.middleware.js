const { clerkClient } = require('@clerk/express');
const User = require('../models/User');
const { errorResponse } = require('../utils/responses');

/**
 * Middleware to verify Clerk authentication
 * Extracts user from Clerk's auth object (set by clerkMiddleware)
 */
const verifyClerkToken = async (req, res, next) => {
  try {
    // Check if Clerk auth is present (set by clerkMiddleware)
    if (!req.auth || !req.auth.userId) {
      return errorResponse(res, 401, 'Authentication required');
    }

    const clerkId = req.auth.userId; // Clerk user ID from req.auth

    // Find user in our database
    const user = await User.findOne({ clerkId });

    if (!user) {
      return errorResponse(res, 404, 'User not found. Please complete onboarding.');
    }

    // Update lastLoginAt
    if (!user.lastLoginAt || Date.now() - user.lastLoginAt > 3600000) {
      // Update if not set or older than 1 hour
      user.lastLoginAt = new Date();
      await user.save();
    }

    // Attach user info to request
    req.auth.mongoUserId = user._id;
    req.auth.email = user.email;
    req.auth.user = user; // Full user object

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return errorResponse(res, 401, 'Authentication failed', error.message);
  }
};

/**
 * Middleware to check if user has completed onboarding
 */
const requireOnboarding = (req, res, next) => {
  if (!req.auth || !req.auth.user) {
    return errorResponse(res, 401, 'Authentication required');
  }

  if (!req.auth.user.isOnboarded) {
    return errorResponse(res, 403, 'Please complete onboarding first');
  }

  next();
};

module.exports = {
  verifyClerkToken,
  requireOnboarding,
};
