const User = require('../models/User');
const { errorResponse } = require('../utils/responses');

/**
 * Middleware to verify Clerk authentication
 * Works with latest @clerk/express (v1.x+) where req.auth is now a function
 * 
 * Usage: 
 * 1. Add clerkMiddleware() to server.js
 * 2. Use verifyClerkToken on protected routes
 */
const verifyClerkToken = async (req, res, next) => {
  try {
    // NEW: Call req.auth() as a function (not an object)
    const auth = await req.auth();
    
    // Check if Clerk auth is present
    if (!auth || !auth.userId) {
      console.warn('⚠️  No Clerk auth found on request');
      return errorResponse(res, 401, 'Authentication required');
    }

    const clerkId = auth.userId;
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

    // Attach user info to request (as an object, not function)
    req.authData = {
      clerkId: clerkId,
      mongoUserId: user._id,
      email: user.email,
      user: user,
      sessionClaims: auth.sessionClaims,
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
    if (!req.authData || !req.authData.user) {
      console.warn('⚠️  No user context in requireOnboarding');
      return errorResponse(res, 401, 'Authentication required');
    }

    if (!req.authData.user.isOnboarded) {
      console.log(`⚠️  User ${req.authData.user.email} has not completed onboarding`);
      return errorResponse(
        res,
        403,
        'Please complete onboarding first',
        'User profile not fully set up'
      );
    }

    console.log(`✅ Onboarding verified for user: ${req.authData.user.email}`);
    next();
  } catch (error) {
    console.error('❌ Onboarding check error:', error);
    return errorResponse(res, 500, 'Authorization check failed', error.message);
  }
};

/**
 * Middleware to optionally check onboarding without failing
 */
const checkOnboardingStatus = (req, res, next) => {
  try {
    if (req.authData && req.authData.user) {
      req.authData.isOnboarded = req.authData.user.isOnboarded || false;
    }
    next();
  } catch (error) {
    console.error('❌ Onboarding status check error:', error);
    next(); // Don't fail, just proceed
  }
};

module.exports = {
  verifyClerkToken,
  requireOnboarding,
  checkOnboardingStatus,
};