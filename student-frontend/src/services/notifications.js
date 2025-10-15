import api from '../api/index';

export const getNotifications = async () => {
  try {
    const { data } = await api.get('/api/notifications/');
    return data;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const { data } = await api.patch(`/api/notifications/${notificationId}/read/`);
    return data;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};

export const markAllAsRead = async () => {
  try {
    const { data } = await api.post('/api/notifications/mark-all-read/');
    return data;
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    throw error;
  }
};
