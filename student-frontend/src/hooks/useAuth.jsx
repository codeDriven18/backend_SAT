import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';

const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    initializeAuth
  } = useAuthStore();

  // Initialize auth on hook mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError
  };
};

export default useAuth;