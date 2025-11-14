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
    const response = await userService.getProfile(); // userService returns payload (response.data)
    // tolerate both shapes: if userService returned full axios response, payload = response.data, else payload = response
    const payload = response?.data ?? response;
    // payload may be { user: {...} } or directly the user object depending on server
    const profileObj = payload?.user ?? payload;
    set({ profile: profileObj, isLoading: false });
    return payload;
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
    const response = await userService.completeOnboarding(data);
    const payload = response?.data ?? response;
    
    // ✅ FIX: Since backend now returns user directly, not nested
    const user = payload?.user ?? payload;
    
    console.log('✅ Onboarded - user object:', user);
    console.log('✅ isOnboarded value:', user?.isOnboarded);
    
    set({ profile: user, isLoading: false });
    return payload;
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
    const response = await userService.updateProfile(data);
    const payload = response?.data ?? response;
    const user = payload?.user ?? payload;
    set({ profile: user, isLoading: false });
    return payload;
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
    const response = await userService.getStats();
    const payload = response?.data ?? response;
    set({ stats: payload, isLoading: false });
    return payload;
  } catch (error) {
    const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
    set({ error: message, isLoading: false });
    throw error;
  }
},

  // Clear profile data
  clearProfile: () => set({ profile: null, stats: null, error: null }),
}));