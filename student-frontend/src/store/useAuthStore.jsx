import { create } from 'zustand';
import { authApi } from '../api/authApi';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Initialize auth state from localStorage
  initializeAuth: () => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      set({
        isAuthenticated: true,
        user: JSON.parse(userData)
      });
    }
  },

  // Login
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(credentials);
      
      // Store tokens and user data
      localStorage.setItem('accessToken', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      localStorage.setItem('userData', JSON.stringify(response.user));
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Login failed';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false
      });
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(userData);
      
      // Store tokens and user data if registration includes auto-login
      if (response.access) {
        localStorage.setItem('accessToken', response.access);
        localStorage.setItem('refreshToken', response.refresh);
        localStorage.setItem('userData', JSON.stringify(response.user));
        
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        set({ isLoading: false });
      }
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Registration failed';
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    
    set({
      user: null,
      isAuthenticated: false,
      error: null
    });
  },

  // Update profile
  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.updateProfile(profileData);
      
      // Update local storage and state
      const updatedUser = { ...get().user, ...response };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      set({
        user: updatedUser,
        isLoading: false,
        error: null
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to update profile';
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error;
    }
  },

  // Update profile picture
  updateProfilePicture: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.updateProfilePicture(file);
      
      // Update local storage and state
      const updatedUser = { ...get().user, ...response };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      set({
        user: updatedUser,
        isLoading: false,
        error: null
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to update profile picture';
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

export default useAuthStore;