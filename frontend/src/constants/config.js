import Constants from 'expo-constants';

// API URLs from .env
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5000',
  ML_URL: process.env.EXPO_PUBLIC_ML_API_URL || 'http://192.168.1.100:8000',
  CHAT_URL: process.env.EXPO_PUBLIC_CHAT_API_URL || 'http://192.168.1.100:8001',
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT) || 30000,
};

// Clerk configuration
export const CLERK_CONFIG = {
  PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
};

// App configuration
export const APP_CONFIG = {
  NAME: 'FitiFy',
  VERSION: Constants.expoConfig?.version || '1.0.0',
  DEBUG: process.env.EXPO_PUBLIC_DEBUG === 'true',
};

// Feature flags
export const FEATURES = {
  FOOD_SCAN: process.env.EXPO_PUBLIC_ENABLE_FOOD_SCAN !== 'false',
  CHATBOT: process.env.EXPO_PUBLIC_ENABLE_CHATBOT !== 'false',
  MEAL_PLANS: process.env.EXPO_PUBLIC_ENABLE_MEAL_PLANS !== 'false',
};

// Validation constants
export const VALIDATION = {
  MIN_AGE: 13,
  MAX_AGE: 120,
  MIN_HEIGHT: 50, // cm
  MAX_HEIGHT: 300, // cm
  MIN_WEIGHT: 20, // kg
  MAX_WEIGHT: 500, // kg
};

export default {
  API_CONFIG,
  CLERK_CONFIG,
  APP_CONFIG,
  FEATURES,
  VALIDATION,
};
