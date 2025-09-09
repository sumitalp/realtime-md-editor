// hooks/useAuth.ts
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { LoginCredentials, RegisterCredentials } from '@/types/auth';

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login,
    register,
    logout,
    clearError,
    refreshToken,
    initialize,
    updateUser,
  } = useAuthStore();

  // Initialize auth on first load
  // useEffect(() => {
  //   initialize();
  // }, [initialize]);

  // Auto-refresh token before it expires (optional)
  useEffect(() => {
    if (isAuthenticated && token) {
      // Set up token refresh interval (e.g., every 6 hours for 7-day tokens)
      const refreshInterval = setInterval(() => {
        refreshToken().catch(() => {
          // Handle refresh failure silently or show notification
        });
      }, 6 * 60 * 60 * 1000); // 6 hours

      return () => clearInterval(refreshInterval);
    }
  }, [isAuthenticated, token, refreshToken]);

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      await login(credentials);
    } catch (error) {
      // Error is already stored in the store, just re-throw for component handling
      throw error;
    }
  };

  const handleRegister = async (credentials: RegisterCredentials) => {
    try {
      await register(credentials);
    } catch (error) {
      // Error is already stored in the store, just re-throw for component handling
      throw error;
    }
  };

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,

    // Actions
    login: handleLogin,
    register: handleRegister,
    logout,
    clearError,
    updateUser,
    initialize,

    // Computed values
    userName: user?.name || '',
    userEmail: user?.email || '',
    userInitials: user?.name
      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
      : '',
  };
};