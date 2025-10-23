import api from './api';

export const userService = {
  // Get user profile
  getProfile: async () => {
    return await api.get('/api/user/profile');
  },

  // Complete onboarding
  completeOnboarding: async (data) => {
    return await api.post('/api/user/onboarding', data);
  },

  // Update profile
  updateProfile: async (data) => {
    return await api.put('/api/user/profile', data);
  },

  // Get user stats
  getStats: async () => {
    return await api.get('/api/user/stats');
  },
};
