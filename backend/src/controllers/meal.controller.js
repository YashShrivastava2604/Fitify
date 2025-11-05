const Meal = require('../models/Meal'); // Change from MealLog to Meal
const { successResponse, errorResponse } = require('../utils/responses');
const { startOfDay, endOfDay } = require('../utils/dateUtils');

/**
 * Log a meal
 * POST /api/meals/log
 */
const logMeal = async (req, res) => {
  try {
    const { foodName, nutrition, mealType, servingSize, imageUrl, source, mlConfidence, mlSource } = req.body;
    const user = req.auth.user;

    // Validation
    if (!foodName || !nutrition || !mealType) {
      return errorResponse(res, 400, 'Missing required fields');
    }

    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return errorResponse(res, 400, 'Invalid meal type');
    }

    // Create meal log using your Meal model
    const meal = await Meal.create({
      userId: user._id,
      clerkId: user.clerkId,
      date: new Date(),
      mealType,
      food: {
        name: foodName,
        servingSize: servingSize || 100,
        servingUnit: 'g'
      },
      nutrition: {
        calories: nutrition.calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fats: nutrition.fats || 0,
        fiber: nutrition.fiber || 0,
        sugar: nutrition.sugar || 0,
        sodium: nutrition.sodium || 0
      },
      source: source || 'scan',
      imageUrl: imageUrl || null,
      notes: req.body.notes || null
    });

    console.log(`✅ Meal logged: ${foodName} for ${user.email}`);

    return successResponse(res, 201, 'Meal logged successfully', {
      meal
    });

  } catch (error) {
    console.error('Log meal error:', error);
    return errorResponse(res, 500, 'Failed to log meal', error.message);
  }
};

/**
 * Get today's meals
 * GET /api/meals/today
 */
const getTodaysMeals = async (req, res) => {
  try {
    const user = req.auth.user;
    const today = new Date();
    
    const meals = await Meal.find({
      userId: user._id,
      date: {
        $gte: startOfDay(today),
        $lte: endOfDay(today)
      }
    }).sort({ createdAt: 1 });

    // Calculate totals
    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.nutrition.calories,
      protein: acc.protein + meal.nutrition.protein,
      carbs: acc.carbs + meal.nutrition.carbs,
      fats: acc.fats + meal.nutrition.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return successResponse(res, 200, 'Today\'s meals fetched', {
      meals,
      totals,
      mealCount: meals.length,
      date: today
    });

  } catch (error) {
    console.error('Get today meals error:', error);
    return errorResponse(res, 500, 'Failed to fetch meals', error.message);
  }
};

/**
 * Get meals for specific date
 * GET /api/meals/date/:date
 */
const getMealsByDate = async (req, res) => {
  try {
    const user = req.auth.user;
    const { date } = req.params;
    
    const targetDate = new Date(date);
    
    if (isNaN(targetDate)) {
      return errorResponse(res, 400, 'Invalid date format');
    }

    const meals = await Meal.find({
      userId: user._id,
      date: {
        $gte: startOfDay(targetDate),
        $lte: endOfDay(targetDate)
      }
    }).sort({ createdAt: 1 });

    // Calculate totals
    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.nutrition.calories,
      protein: acc.protein + meal.nutrition.protein,
      carbs: acc.carbs + meal.nutrition.carbs,
      fats: acc.fats + meal.nutrition.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return successResponse(res, 200, 'Meals fetched', {
      meals,
      totals,
      mealCount: meals.length,
      date: targetDate
    });

  } catch (error) {
    console.error('Get meals by date error:', error);
    return errorResponse(res, 500, 'Failed to fetch meals', error.message);
  }
};

/**
 * Get daily summary
 * GET /api/meals/summary/:date
 */
const getDailySummary = async (req, res) => {
  try {
    const user = req.auth.user;
    const { date } = req.params;
    
    const targetDate = new Date(date);

    const meals = await Meal.find({
      userId: user._id,
      date: {
        $gte: startOfDay(targetDate),
        $lte: endOfDay(targetDate)
      }
    });

    // Group by meal type
    const mealsByType = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };

    meals.forEach(meal => {
      mealsByType[meal.mealType].push(meal);
    });

    // Calculate totals
    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.nutrition.calories,
      protein: acc.protein + meal.nutrition.protein,
      carbs: acc.carbs + meal.nutrition.carbs,
      fats: acc.fats + meal.nutrition.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    // Calculate remaining (based on user's target)
    const remaining = {
      calories: user.dailyCalorieTarget - totals.calories,
      protein: user.macroTargets.protein - totals.protein,
      carbs: user.macroTargets.carbs - totals.carbs,
      fats: user.macroTargets.fats - totals.fats
    };

    return successResponse(res, 200, 'Daily summary fetched', {
      date: targetDate,
      mealsByType,
      totals,
      remaining,
      target: {
        calories: user.dailyCalorieTarget,
        protein: user.macroTargets.protein,
        carbs: user.macroTargets.carbs,
        fats: user.macroTargets.fats
      }
    });

  } catch (error) {
    console.error('Get daily summary error:', error);
    return errorResponse(res, 500, 'Failed to fetch summary', error.message);
  }
};

/**
 * Update meal
 * PUT /api/meals/:id
 */
const updateMeal = async (req, res) => {
  try {
    const user = req.auth.user;
    const { id } = req.params;
    const updates = req.body;

    const meal = await Meal.findOne({
      _id: id,
      userId: user._id
    });

    if (!meal) {
      return errorResponse(res, 404, 'Meal not found');
    }

    // Update allowed fields
    if (updates.servingSize) meal.food.servingSize = updates.servingSize;
    if (updates.notes) meal.notes = updates.notes;
    if (updates.nutrition) meal.nutrition = { ...meal.nutrition, ...updates.nutrition };

    await meal.save();

    return successResponse(res, 200, 'Meal updated', { meal });

  } catch (error) {
    console.error('Update meal error:', error);
    return errorResponse(res, 500, 'Failed to update meal', error.message);
  }
};

/**
 * Delete meal
 * DELETE /api/meals/:id
 */
const deleteMeal = async (req, res) => {
  try {
    const user = req.auth.user;
    const { id } = req.params;

    const meal = await Meal.findOneAndDelete({
      _id: id,
      userId: user._id
    });

    if (!meal) {
      return errorResponse(res, 404, 'Meal not found');
    }

    console.log(`🗑️  Meal deleted: ${meal.food.name} for ${user.email}`);

    return successResponse(res, 200, 'Meal deleted');

  } catch (error) {
    console.error('Delete meal error:', error);
    return errorResponse(res, 500, 'Failed to delete meal', error.message);
  }
};

/**
 * Get weekly nutrition data
 * GET /api/meals/week/:startDate
 */
const getWeeklyData = async (req, res) => {
  try {
    const user = req.auth.user;
    const { startDate } = req.params;
    
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const meals = await Meal.find({
      userId: user._id,
      date: { $gte: start, $lt: end }
    }).sort({ date: 1 });

    // Group by day
    const dailyData = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      dailyData[dateKey] = {
        date: date,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        mealCount: 0
      };
    }

    meals.forEach(meal => {
      const dateKey = meal.date.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].calories += meal.nutrition.calories;
        dailyData[dateKey].protein += meal.nutrition.protein;
        dailyData[dateKey].carbs += meal.nutrition.carbs;
        dailyData[dateKey].fats += meal.nutrition.fats;
        dailyData[dateKey].mealCount += 1;
      }
    });

    return successResponse(res, 200, 'Weekly data fetched', {
      startDate: start,
      endDate: end,
      dailyData: Object.values(dailyData)
    });

  } catch (error) {
    console.error('Get weekly data error:', error);
    return errorResponse(res, 500, 'Failed to fetch weekly data', error.message);
  }
};

module.exports = {
  logMeal,
  getTodaysMeals,
  getMealsByDate,
  getDailySummary,
  updateMeal,
  deleteMeal,
  getWeeklyData
};
