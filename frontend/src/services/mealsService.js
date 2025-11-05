import api from './api';

/**
 * Log a meal
 */
export const logMeal = async (mealData) => {
  try {
    const response = await api.post('/api/meals/log', mealData);
    return response.data;
  } catch (error) {
    console.error('Log meal error:', error);
    throw error;
  }
};

/**
 * Get today's meals
 */
export const getTodaysMeals = async () => {
  try {
    const response = await api.get('/api/meals/today');
    return response.data;
  } catch (error) {
    console.error('Get today meals error:', error);
    throw error;
  }
};

/**
 * Get meals by date
 */
export const getMealsByDate = async (date) => {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const response = await api.get(`/api/meals/date/${dateStr}`);
    return response.data;
  } catch (error) {
    console.error('Get meals by date error:', error);
    throw error;
  }
};

/**
 * Get daily summary
 */
export const getDailySummary = async (date) => {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const response = await api.get(`/api/meals/summary/${dateStr}`);
    return response.data;
  } catch (error) {
    console.error('Get daily summary error:', error);
    throw error;
  }
};

/**
 * Delete meal
 */
export const deleteMeal = async (mealId) => {
  try {
    const response = await api.delete(`/api/meals/${mealId}`);
    return response.data;
  } catch (error) {
    console.error('Delete meal error:', error);
    throw error;
  }
};

/**
 * Get weekly data
 */
export const getWeeklyData = async (startDate) => {
  try {
    const dateStr = startDate.toISOString().split('T')[0];
    const response = await api.get(`/api/meals/week/${dateStr}`);
    return response.data;
  } catch (error) {
    console.error('Get weekly data error:', error);
    throw error;
  }
};
export default {
  logMeal,
  getTodaysMeals,
  getMealsByDate,
  getDailySummary,
  deleteMeal,
  getWeeklyData
};