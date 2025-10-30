const User = require('../models/User');
const { errorResponse } = require('../utils/responses');

const verifyClerkToken = async (req, res, next) => {
  try {
    // Check if req.auth exists and get the auth object
    let auth;
    
    // Handle both function and object patterns
    if (typeof req.auth === 'function') {
      auth = await req.auth();
    } else if (req.auth && typeof req.auth === 'object') {
      auth = req.auth;
    }
    
    if (!auth || !auth.userId) {
      console.warn('⚠️  No Clerk auth found on request');
      return errorResponse(res, 401, 'Authentication required');
    }

    const clerkId = auth.userId;
    console.log(`🔍 Verifying user with clerkId: ${clerkId}`);

    let user = await User.findOne({ clerkId });

    // AUTO-CREATE USER IF NOT FOUND (webhook might have failed)
    if (!user) {
      console.log(`⚠️  User ${clerkId} not found - creating from token`);
      
      // Get email from session claims
      const email = auth.sessionClaims?.email || auth.sessionClaims?.primaryEmailAddress;
      
      if (!email) {
        console.error('❌ No email in session claims:', auth.sessionClaims);
        return errorResponse(res, 400, 'Unable to create user - no email found');
      }

      user = new User({
        clerkId: clerkId,
        email: email.toLowerCase(),
        firstName: auth.sessionClaims?.firstName || '',
        lastName: auth.sessionClaims?.lastName || '',
        profileImageUrl: auth.sessionClaims?.imageUrl || '',
        isOnboarded: false,
      });

      await user.save();
      console.log(`✅ Auto-created user: ${user.email} (${clerkId})`);
    }

    // Update lastLoginAt (throttled)
    const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
    const timeSinceLastLogin = lastLogin ? Date.now() - lastLogin.getTime() : Infinity;

    if (!lastLogin || timeSinceLastLogin > 3600000) {
      user.lastLoginAt = new Date();
      await user.save();
      console.log(`✅ Updated lastLoginAt for user: ${user.email}`);
    }

    // Attach to req.auth
    req.auth = {
      clerkId: clerkId,
      mongoUserId: user._id,
      email: user.email,
      user: user,
      sessionClaims: auth.sessionClaims,
    };

    console.log(`✅ Auth verified for user: ${user.email} (MongoDB: ${user._id})`);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return errorResponse(res, 401, 'Authentication failed', error.message);
  }
};

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

const checkOnboardingStatus = (req, res, next) => {
  try {
    if (req.auth && req.auth.user) {
      req.auth.isOnboarded = req.auth.user.isOnboarded || false;
    }
    next();
  } catch (error) {
    console.error('❌ Onboarding status check error:', error);
    next();
  }
};

module.exports = {
  verifyClerkToken,
  requireOnboarding,
  checkOnboardingStatus,
};
