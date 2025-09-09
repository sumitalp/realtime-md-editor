import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '@/services/auth.service';
import { User, LoginCredentials, RegisterCredentials, AuthError } from '@/types/auth';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshToken: () => Promise<void>;
  initialize: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Login Action
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authService.login(credentials);
          
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

        } catch (error) {
          const authError: AuthError = {
            message: error instanceof Error ? error.message : 'Login failed',
          };

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: authError,
          });

          throw error;
        }
      },

      // Register Action
      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authService.register(credentials);
          
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

        } catch (error) {
          const authError: AuthError = {
            message: error instanceof Error ? error.message : 'Registration failed',
          };

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: authError,
          });

          throw error;
        }
      },

      // Logout Action
      logout: () => {
        authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Clear Error Action
      clearError: () => {
        set({ error: null });
      },

      // Refresh Token Action
      refreshToken: async () => {
        try {
          const response = await authService.refreshToken();
          
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            error: null,
          });

        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      // Initialize Authentication
      initialize: async () => {
        if (typeof window === 'undefined') return;
        
        set({ isLoading: true });

        try {
          // Check for existing token in localStorage
          const token = localStorage.getItem('auth-token');
          
          if (!token) {
            set({ isInitialized: true, isLoading: false });
            return;
          }
          // Verify token by fetching user data
          const user = await authService.getCurrentUser();
          
          set({
            user,
            token,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            error: null,
          });

        } catch (error) {
          console.log("Current user error: ", error)
          // Token is invalid, clear it
          authService.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
          });
        }
      },

      // Update User Action
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData },
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Ensure initialization happens after hydration
        if (state) {
          state.isInitialized = false;
        }
      },
    }
  )
);