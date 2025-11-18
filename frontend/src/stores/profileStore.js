import { create } from 'zustand';
import { userService } from '../services/userService';

export const useProfileStore = create((set, get) => ({
  profile: null,
  stats: null,
  isLoading: false,
  error: null,

  /**
   * Fetch user profile
   */
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('📋 Store: Fetching profile...');
      const user = await userService.getProfile();
      
      console.log('✅ Store: Profile loaded:', user?.email);
      
      set({ profile: user, isLoading: false });
      return user;
    } catch (error) {
      const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      console.error('❌ Store: Fetch profile error:', message);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Complete onboarding
   */
  completeOnboarding: async (data) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🚀 Store: Completing onboarding...');
      const user = await userService.completeOnboarding(data);
      
      console.log('✅ Store: Onboarded - user object:', user);
      console.log('✅ Store: isOnboarded value:', user?.isOnboarded);
      
      set({ profile: user, isLoading: false });
      return user;
    } catch (error) {
      const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      console.error('❌ Store: Onboarding error:', message);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Update profile (personal info, weight, age, height, etc.)
   */
  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      console.log('📝 Store: Updating profile with data:', data);
      
      const user = await userService.updateProfile(data);
      
      console.log('✅ Store: Profile updated:', user?.email);
      
      set({ profile: user, isLoading: false });
      return user;
    } catch (error) {
      const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      console.error('❌ Store: Update profile error:', message);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch stats (weight history, nutrition trends, etc.)
   */
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('📊 Store: Fetching stats...');
      
      const stats = await userService.getStats();
      
      console.log('✅ Store: Stats loaded');
      
      set({ stats, isLoading: false });
      return stats;
    } catch (error) {
      const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      console.error('❌ Store: Fetch stats error:', message);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Clear profile data on sign out
   */
  clearProfile: () => {
    console.log('🗑️ Store: Clearing profile data');
    set({ 
      profile: null, 
      stats: null, 
      error: null,
      isLoading: false 
    });
  }
}));
