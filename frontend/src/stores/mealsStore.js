import { create } from 'zustand';
import * as mealsService from '../services/mealsService';

export const useMealsStore = create((set, get) => ({
  todaysMeals: [],
  todaysTotals: null,
  selectedDateMeals: [],
  dailySummary: null,
  isLoading: false,
  error: null,

  // Fetch today's meals
  fetchTodaysMeals: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await mealsService.getTodaysMeals();
      set({
        todaysMeals: result?.meals || [],
        todaysTotals: result?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 },
        isLoading: false
      });
      return result;
    } catch (error) {
      console.error('Fetch today meals error:', error);
      set({ 
        todaysMeals: [],
        todaysTotals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },

  // Log meal
  logMeal: async (mealData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await mealsService.logMeal(mealData);
      
      // Refresh today's meals
      await get().fetchTodaysMeals();
      
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Log meal error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Get meals by date
  fetchMealsByDate: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const result = await mealsService.getMealsByDate(date);
      set({
        selectedDateMeals: result?.meals || [],
        isLoading: false
      });
      return result;
    } catch (error) {
      console.error('Fetch meals by date error:', error);
      set({ 
        selectedDateMeals: [],
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },

  // Get daily summary
  fetchDailySummary: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const result = await mealsService.getDailySummary(date);
      set({
        dailySummary: result || null,
        isLoading: false
      });
      return result;
    } catch (error) {
      console.error('Fetch daily summary error:', error);
      set({ 
        dailySummary: null,
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },

  // Delete meal
  deleteMeal: async (mealId) => {
    set({ isLoading: true, error: null });
    try {
      await mealsService.deleteMeal(mealId);
      
      // Refresh today's meals
      await get().fetchTodaysMeals();
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Delete meal error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Clear data
  clearMeals: () => set({
    todaysMeals: [],
    todaysTotals: null,
    selectedDateMeals: [],
    dailySummary: null,
    error: null
  })
}));
