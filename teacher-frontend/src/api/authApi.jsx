import api from './index';

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login/', credentials),
  register: (userData) => api.post('/api/auth/register/', userData),
  refreshToken: (refresh) => api.post('/api/auth/token/refresh/', { refresh }),
};

