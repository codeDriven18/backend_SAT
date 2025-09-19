import api from './index';

export const authApi = {
  // Register new student
  register: async (userData) => {
    const response = await api.post('/api/auth/register/', {
      ...userData,
      user_type: 'student'
    });
    return response.data;
  },

  // Login student
  login: async (credentials) => {
    const response = await api.post('/api/auth/login/', credentials);
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/api/auth/token/refresh/', {
      refresh: refreshToken
    });
    return response.data;
  },

  // Get current user profile (if needed)
  getProfile: async () => {
    const response = await api.get('/api/auth/profile/');
    return response.data;
  }
};