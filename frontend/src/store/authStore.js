import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Auth Store
 * Manages user authentication state
 * Persisted to localStorage
 */

const useAuthStore = create(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,

      // Actions
      setUser: (user) => 
        set({ 
          user, 
          isAuthenticated: true 
        }),

      clearUser: () => 
        set({ 
          user: null, 
          isAuthenticated: false 
        }),

      logout: () => {
        // Clear user state
        set({ 
          user: null, 
          isAuthenticated: false 
        });
        // Clear localStorage
        localStorage.removeItem('auth-storage');
        // Clear any tokens or session data
        localStorage.removeItem('token');
        return Promise.resolve();
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage', // LocalStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;

