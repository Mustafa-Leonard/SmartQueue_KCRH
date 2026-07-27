import api from './axios.js';

export const getNotifications = async ({ status, type, page = 1, limit = 20 } = {}) => {
  const params = { page, limit };
  if (status) params.status = status;
  if (type) params.type = type;
  const response = await api.get('/notifications', { params });
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.post('/notifications/read-all');
  return response.data;
};

