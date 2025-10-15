import api from './index';

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login/', credentials),
  register: (userData) => api.post('/api/auth/register/', userData),
  refreshToken: (refresh) => api.post('/api/auth/token/refresh/', { refresh }),
  updateProfile: (profileData) => api.patch('/api/auth/me/', profileData),
  updateProfilePicture: (formData) => {
    // Don't set Content-Type - let browser handle it with proper boundary
    return api.patch('/api/auth/me/', formData, {
      headers: {
        'Content-Type': undefined, // Remove default Content-Type
      },
    });
  },
};

