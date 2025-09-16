import { create } from 'zustand';
import { authAPI } from '../api/authApi';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.login(credentials);
      const { access, refresh, user } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user)); 
      set({ 
        user, 
        isAuthenticated: true, 
        loading: false 
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
  },

  // checkAuth: () => {
  //   const token = localStorage.getItem('access_token');
  //   if (token) {
  //     // You might want to validate the token with the server
  //     set({ isAuthenticated: true });
  //   }
  // },
  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      set({ user: JSON.parse(user), isAuthenticated: true });
    } else {
      set({ user: null, isAuthenticated: false });
    }
  

  },
  
}));

export default useAuthStore;