const User = require('../models/User');
const WeightLog = require('../models/WeightLog');
const { successResponse, errorResponse } = require('../utils/responses');
const {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateMacros,
  calculateIdealWeightRange,
} = require('../utils/calculations');

/**
 * Get current user profile
 * GET /api/user/profile
 */
const getUserProfile = async (req, res) => {
  try {
    // Use mongoUserId (set by verifyClerkToken middleware)
    const user = await User.findById(req.auth.mongoUserId).select('-__v');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'Profile fetched successfully', user);
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 500, 'Failed to fetch profile', error.message);
  }
};

/**
 * Complete user onboarding
 * POST /api/user/onboarding
 */
const completeOnboarding = async (req, res) => {
  try {
    const { age, gender, height, currentWeight, goal, activityLevel, dietaryRestrictions } = req.body;

    // Validation
    if (!age || !gender || !height || !currentWeight || !goal) {
      return errorResponse(res, 400, 'Missing required fields');
    }

    const user = await User.findById(req.auth.mongoUserId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Calculate health metrics
    const bmi = calculateBMI(currentWeight, height);
    const bmiCategory = getBMICategory(bmi);
    const bmr = calculateBMR(currentWeight, height, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel || 'sedentary');
    const dailyCalorieTarget = calculateCalorieTarget(tdee, goal);
    const macros = calculateMacros(dailyCalorieTarget, goal);

    // Update user profile
    user.age = age;
    user.gender = gender;
    user.height = height;
    user.currentWeight = currentWeight;
    user.goal = goal;
    user.activityLevel = activityLevel || 'sedentary';
    user.dietaryRestrictions = dietaryRestrictions || [];
    user.bmi = bmi;
    user.bmiCategory = bmiCategory;
    user.bmr = bmr;
    user.tdee = tdee;
    user.dailyCalorieTarget = dailyCalorieTarget;
    user.macroTargets = macros;
    user.isOnboarded = true;
    user.onboardingCompletedAt = new Date();

    await user.save();

    // Create initial weight log
    await WeightLog.create({
      userId: user._id,
      clerkId: user.clerkId,
      date: new Date(),
      weight: currentWeight,
    });

    console.log(`✅ User ${user.email} completed onboarding`);

    return successResponse(res, 200, 'Onboarding completed successfully', {
      user,
      idealWeightRange: calculateIdealWeightRange(height),
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return errorResponse(res, 500, 'Onboarding failed', error.message);
  }
};

/**
 * Update user profile
 * PUT /api/user/profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.auth.mongoUserId);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Allowed fields to update
    const allowedUpdates = [
      'age', 'gender', 'height', 'currentWeight', 'goal', 
      'activityLevel', 'dietaryRestrictions', 'settings'
    ];

    // Filter out non-allowed updates
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // If weight, height, age, gender, goal, or activity changes, recalculate metrics
    const needsRecalculation = ['age', 'gender', 'height', 'currentWeight', 'goal', 'activityLevel']
      .some(field => field in filteredUpdates);

    if (needsRecalculation) {
      const age = filteredUpdates.age || user.age;
      const gender = filteredUpdates.gender || user.gender;
      const height = filteredUpdates.height || user.height;
      const weight = filteredUpdates.currentWeight || user.currentWeight;
      const goal = filteredUpdates.goal || user.goal;
      const activityLevel = filteredUpdates.activityLevel || user.activityLevel;

      const bmi = calculateBMI(weight, height);
      const bmiCategory = getBMICategory(bmi);
      const bmr = calculateBMR(weight, height, age, gender);
      const tdee = calculateTDEE(bmr, activityLevel);
      const dailyCalorieTarget = calculateCalorieTarget(tdee, goal);
      const macros = calculateMacros(dailyCalorieTarget, goal);

      filteredUpdates.bmi = bmi;
      filteredUpdates.bmiCategory = bmiCategory;
      filteredUpdates.bmr = bmr;
      filteredUpdates.tdee = tdee;
      filteredUpdates.dailyCalorieTarget = dailyCalorieTarget;
      filteredUpdates.macroTargets = macros;

      // If weight changed, log it
      if (filteredUpdates.currentWeight && filteredUpdates.currentWeight !== user.currentWeight) {
        await WeightLog.create({
          userId: user._id,
          clerkId: user.clerkId,
          date: new Date(),
          weight: filteredUpdates.currentWeight,
        });
      }
    }

    // Apply updates
    Object.assign(user, filteredUpdates);
    await user.save();

    console.log(`✅ Updated profile for user: ${user.email}`);

    return successResponse(res, 200, 'Profile updated successfully', user);
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, 500, 'Failed to update profile', error.message);
  }
};

/**
 * Get user statistics
 * GET /api/user/stats
 */
const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.auth.mongoUserId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Get weight history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const weightHistory = await WeightLog.find({
      userId: user._id,
      date: { $gte: thirtyDaysAgo },
    })
      .sort({ date: 1 })
      .select('date weight -_id');

    // Calculate weight change
    let weightChange = 0;
    if (weightHistory.length > 1) {
      const firstWeight = weightHistory[0].weight;
      const lastWeight = weightHistory[weightHistory.length - 1].weight;
      weightChange = lastWeight - firstWeight;
    }

    const stats = {
      currentWeight: user.currentWeight,
      targetWeight: user.goal === 'lose' 
        ? user.currentWeight - 5 
        : user.goal === 'gain' 
          ? user.currentWeight + 5 
          : user.currentWeight,
      weightChange,
      bmi: user.bmi,
      bmiCategory: user.bmiCategory,
      dailyCalorieTarget: user.dailyCalorieTarget,
      macroTargets: user.macroTargets,
      idealWeightRange: calculateIdealWeightRange(user.height),
      weightHistory,
    };

    return successResponse(res, 200, 'Stats fetched successfully', stats);
  } catch (error) {
    console.error('Get stats error:', error);
    return errorResponse(res, 500, 'Failed to fetch stats', error.message);
  }
};

module.exports = {
  getUserProfile,
  completeOnboarding,
  updateUserProfile,
  getUserStats,
};
