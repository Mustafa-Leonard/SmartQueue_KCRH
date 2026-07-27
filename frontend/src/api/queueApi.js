import api from './axios.js';

export const getTodayQueue = async (branchId) => {
  const response = await api.get(`/queues/today/${branchId}`);
  return response.data;
};

export const openQueue = async (branchId) => {
  const response = await api.post('/queues/open', { branchId });
  return response.data;
};

export const closeQueue = async (queueId) => {
  const response = await api.put(`/queues/${queueId}/close`);
  return response.data;
};
