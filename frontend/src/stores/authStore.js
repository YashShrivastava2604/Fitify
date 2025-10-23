import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, error: null }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearUser: () => set({ user: null, error: null }),
  
  clearError: () => set({ error: null }),
}));
