const User = require('../models/User');
const { errorResponse } = require('../utils/responses');

/**
 * Middleware to verify Clerk authentication
 * Extracts user from Clerk's auth object (set by clerkMiddleware in server.js)
 * 
 * Usage: app.use(clerkMiddleware); then use verifyClerkToken on protected routes
 */
const verifyClerkToken = async (req, res, next) => {
  try {
    // Check if Clerk auth is present (set by clerkMiddleware)
    if (!req.auth || !req.auth.userId) {
      console.warn('⚠️  No Clerk auth found on request');
      return errorResponse(res, 401, 'Authentication required');
    }

    const clerkId = req.auth.userId; // Clerk user ID from req.auth

    console.log(`🔍 Verifying user: ${clerkId}`);

    // Find user in our database
    const user = await User.findOne({ clerkId });

    if (!user) {
      console.warn(`⚠️  User ${clerkId} not found in database`);
      return errorResponse(res, 404, 'User not found. Please complete onboarding.');
    }

    // Update lastLoginAt (throttle updates to avoid too many DB writes)
    const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
    const timeSinceLastLogin = lastLogin ? Date.now() - lastLogin.getTime() : Infinity;

    if (!lastLogin || timeSinceLastLogin > 3600000) {
      // Update if not set or older than 1 hour
      user.lastLoginAt = new Date();
      await user.save();
      console.log(`✅ Updated lastLoginAt for user: ${user.email}`);
    }

    // Attach user info to request for use in route handlers
    req.auth.mongoUserId = user._id;
    req.auth.email = user.email;
    req.auth.user = user; // Full user object
    req.auth.clerkUser = {
      id: clerkId,
      primaryEmailAddress: req.auth.sessionClaims?.email || user.email,
    };

    console.log(`✅ Auth verified for user: ${user.email}`);

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return errorResponse(res, 401, 'Authentication failed', error.message);
  }
};

/**
 * Middleware to check if user has completed onboarding
 * Must be used AFTER verifyClerkToken
 */
const requireOnboarding = (req, res, next) => {
  try {
    if (!req.auth || !req.auth.user) {
      console.warn('⚠️  No user context in requireOnboarding');
      return errorResponse(res, 401, 'Authentication required');
    }

    if (!req.auth.user.isOnboarded) {
      console.log(`⚠️  User ${req.auth.user.email} has not completed onboarding`);
      return errorResponse(
        res,
        403,
        'Please complete onboarding first',
        'User profile not fully set up'
      );
    }

    console.log(`✅ Onboarding verified for user: ${req.auth.user.email}`);
    next();
  } catch (error) {
    console.error('❌ Onboarding check error:', error);
    return errorResponse(res, 500, 'Authorization check failed', error.message);
  }
};

/**
 * Middleware to optionally check onboarding without failing
 * Useful for routes that should work for both onboarded and non-onboarded users
 */
const checkOnboardingStatus = (req, res, next) => {
  try {
    if (req.auth && req.auth.user) {
      req.auth.isOnboarded = req.auth.user.isOnboarded || false;
    }
    next();
  } catch (error) {
    console.error('❌ Onboarding status check error:', error);
    next(); // Don't fail, just proceed without status
  }
};

module.exports = {
  verifyClerkToken,
  requireOnboarding,
  checkOnboardingStatus,
};
