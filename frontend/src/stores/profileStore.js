import { create } from 'zustand';
import { userService } from '../services/userService';

export const useProfileStore = create((set, get) => ({
  profile: null,
  stats: null,
  isLoading: false,
  error: null,

  // Fetch user profile
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.getProfile();
      set({ profile: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Complete onboarding
  completeOnboarding: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.completeOnboarding(data);
      set({ profile: response.data.user, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update profile
  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.updateProfile(data);
      set({ profile: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Fetch stats
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.getStats();
      set({ stats: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  // Clear profile data
  clearProfile: () => set({ profile: null, stats: null, error: null }),
}));