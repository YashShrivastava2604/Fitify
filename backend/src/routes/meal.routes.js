const express = require('express');
const router = express.Router();
const { verifyClerkToken } = require('../middleware/clerkAuth.middleware');
const {
  logMeal,
  getTodaysMeals,
  getMealsByDate,
  getDailySummary,
  updateMeal,
  deleteMeal,
  getWeeklyData
} = require('../controllers/meal.controller');

// Log meal
// POST /api/meals/log
router.post('/log', verifyClerkToken, logMeal);

// Get today's meals
// GET /api/meals/today
router.get('/today', verifyClerkToken, getTodaysMeals);

// Get meals by date
// GET /api/meals/date/:date
router.get('/date/:date', verifyClerkToken, getMealsByDate);

// Get daily summary
// GET /api/meals/summary/:date
router.get('/summary/:date', verifyClerkToken, getDailySummary);

// Update meal
// PUT /api/meals/:id
router.put('/:id', verifyClerkToken, updateMeal);

// Delete meal
// DELETE /api/meals/:id
router.delete('/:id', verifyClerkToken, deleteMeal);

// Get weekly data
// GET /api/meals/week/:startDate
router.get('/week/:startDate', verifyClerkToken, getWeeklyData);

module.exports = router;