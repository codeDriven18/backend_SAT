import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';

export const useAuth = () => {
  const { checkAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { isAuthenticated, user };
};