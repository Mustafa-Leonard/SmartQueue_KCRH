import api from './axios.js';

export const createFeedback = async (data) => {
  const response = await api.post('/feedback', data);
  return response.data;
};

export const getMyFeedback = async () => {
  const response = await api.get('/feedback/my');
  return response.data;
};

export const getAllFeedback = async (filters = {}) => {
  const params = {};
  if (filters.category) params.category = filters.category;
  if (filters.isRead !== undefined) params.isRead = filters.isRead;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  const response = await api.get('/feedback', { params });
  return response.data;
};

export const getFeedbackStats = async () => {
  const response = await api.get('/feedback/stats');
  return response.data;
};

export const markFeedbackRead = async (id) => {
  const response = await api.patch(`/feedback/${id}/read`);
  return response.data;
};

