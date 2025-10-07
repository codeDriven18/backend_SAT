import api from './index';

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login/', credentials),
  register: (userData) => api.post('/api/auth/register/', userData),
  refreshToken: (refresh) => api.post('/api/auth/token/refresh/', { refresh }),
  getMe: () => api.get('/api/auth/me/'),
  uploadProfilePicture: (file) => {
    const form = new FormData();
    form.append('profile_picture', file);
    return api.patch('/api/auth/me/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

