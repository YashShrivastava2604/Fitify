import api from './api';

export const userService = {
  // Get user profile
  getProfile: async () => {
    const response =  await api.get('/api/user/profile');
    return response.data;
  },

  // Complete onboarding
  completeOnboarding: async (data) => {
    const response =  await api.post('/api/user/onboarding', data);
    return response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response =  await api.put('/api/user/profile', data);
    return response.data;
  },

  // Get user stats
  getStats: async () => {
    const response =  await api.get('/api/user/stats');
    return response.data;
  },
};
