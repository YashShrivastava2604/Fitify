const { validationErrorResponse } = require('../utils/responses');

/**
 * Validation middleware for request data
 * Can be expanded with more validation rules as needed
 */

/**
 * Validate onboarding data
 */
const validateOnboarding = (req, res, next) => {
  const { age, gender, height, currentWeight, goal } = req.body;
  const errors = [];

  if (!age || age < 13 || age > 120) {
    errors.push({ field: 'age', message: 'Age must be between 13 and 120' });
  }

  if (!gender || !['male', 'female', 'other'].includes(gender)) {
    errors.push({ field: 'gender', message: 'Gender must be male, female, or other' });
  }

  if (!height || height < 50 || height > 300) {
    errors.push({ field: 'height', message: 'Height must be between 50 and 300 cm' });
  }

  if (!currentWeight || currentWeight < 20 || currentWeight > 500) {
    errors.push({ field: 'currentWeight', message: 'Weight must be between 20 and 500 kg' });
  }

  if (!goal || !['lose', 'maintain', 'gain'].includes(goal)) {
    errors.push({ field: 'goal', message: 'Goal must be lose, maintain, or gain' });
  }

  if (errors.length > 0) {
    return validationErrorResponse(res, errors);
  }

  next();
};

/**
 * Validate meal log data
 */
const validateMealLog = (req, res, next) => {
  const { date, mealType, food, nutrition } = req.body;
  const errors = [];

  if (!date) {
    errors.push({ field: 'date', message: 'Date is required' });
  }

  if (!mealType || !['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
    errors.push({ field: 'mealType', message: 'Meal type must be breakfast, lunch, dinner, or snack' });
  }

  if (!food || !food.name) {
    errors.push({ field: 'food.name', message: 'Food name is required' });
  }

  if (!food || !food.servingSize || food.servingSize <= 0) {
    errors.push({ field: 'food.servingSize', message: 'Valid serving size is required' });
  }

  if (!nutrition || typeof nutrition.calories !== 'number') {
    errors.push({ field: 'nutrition.calories', message: 'Calories must be a number' });
  }

  if (errors.length > 0) {
    return validationErrorResponse(res, errors);
  }

  next();
};

/**
 * Validate weight log data
 */
const validateWeightLog = (req, res, next) => {
  const { date, weight } = req.body;
  const errors = [];

  if (!date) {
    errors.push({ field: 'date', message: 'Date is required' });
  }

  if (!weight || weight < 20 || weight > 500) {
    errors.push({ field: 'weight', message: 'Weight must be between 20 and 500 kg' });
  }

  if (errors.length > 0) {
    return validationErrorResponse(res, errors);
  }

  next();
};

module.exports = {
  validateOnboarding,
  validateMealLog,
  validateWeightLog,
};
