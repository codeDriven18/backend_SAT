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
      
      // Construct full profile picture URL
      if (user.profile_picture && !user.profile_picture.startsWith('http')) {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        user.profile_picture = baseURL + user.profile_picture;
      }
      
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
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      
      // Ensure profile picture has full URL
      if (user.profile_picture && !user.profile_picture.startsWith('http')) {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        user.profile_picture = baseURL + user.profile_picture;
      }
      
      set({ user, isAuthenticated: true });
    } else {
      set({ user: null, isAuthenticated: false });
    }
  },

  updateProfile: async (profileData) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.updateProfile(profileData);
      // Backend returns {message, user}
      const updatedUser = response.data.user || response.data;
      
      // Construct full profile picture URL
      if (updatedUser.profile_picture && !updatedUser.profile_picture.startsWith('http')) {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        updatedUser.profile_picture = baseURL + updatedUser.profile_picture;
      }
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ 
        user: updatedUser, 
        loading: false 
      });
      
      return { success: true, data: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to update profile';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateProfilePicture: async (file) => {
    set({ loading: true, error: null });
    try {
      // Validate file
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file object');
      }
      
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const formData = new FormData();
      formData.append('profile_picture', file, file.name);
      
      // Debug: Verify FormData
      for (let pair of formData.entries()) {
        console.log('FormData entry:', pair[0], pair[1]);
      }
      
      const response = await authAPI.updateProfilePicture(formData);
      // Backend returns {message: "Profile picture updated", user: {...}}
      const updatedUser = response.data.user || response.data;
      
      console.log('✅ Upload success! User:', updatedUser);
      
      // Construct full profile picture URL
      if (updatedUser.profile_picture && !updatedUser.profile_picture.startsWith('http')) {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        updatedUser.profile_picture = baseURL + updatedUser.profile_picture;
        console.log('📸 Full image URL:', updatedUser.profile_picture);
      }
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ 
        user: updatedUser, 
        loading: false 
      });
      
      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('❌ Profile picture upload error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message || 'Failed to upload image';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },
  
}));

export default useAuthStore;