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
      // ✅ userService now returns the user object directly
      const user = await userService.getProfile();
      set({ profile: user, isLoading: false });
      return user;
    } catch (error) {
      const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Complete onboarding
  completeOnboarding: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // ✅ userService now returns the user object directly
      const user = await userService.completeOnboarding(data);
      
      console.log('✅ Onboarded - user object:', user);
      console.log('✅ isOnboarded value:', user?.isOnboarded);
      
      set({ profile: user, isLoading: false });
      return user;
    } catch (error) {
      const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update profile
  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await userService.updateProfile(data);
      set({ profile: user, isLoading: false });
      return user;
    } catch (error) {
      const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Fetch stats
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await userService.getStats();
      set({ stats, isLoading: false });
      return stats;
    } catch (error) {
      const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Clear profile data
  clearProfile: () => set({ profile: null, stats: null, error: null }),
}));
