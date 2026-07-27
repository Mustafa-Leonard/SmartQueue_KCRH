import api from './axios.js';

export const joinQueue = async (data) => {
  const response = await api.post('/tickets/join', data);
  return response.data;
};

export const trackTicket = async (ticketCode) => {
  const response = await api.get(`/tickets/track/${ticketCode}`);
  return response.data;
};

export const getBranchTickets = async (branchId, status) => {
  const params = status ? { status } : {};
  const response = await api.get(`/tickets/branch/${branchId}`, { params });
  return response.data;
};

export const callTicket = async (id, counterId) => {
  const response = await api.post(`/tickets/${id}/call`, { counterId });
  return response.data;
};

export const serveTicket = async (id) => {
  const response = await api.post(`/tickets/${id}/serve`);
  return response.data;
};

export const completeTicket = async (id) => {
  const response = await api.post(`/tickets/${id}/complete`);
  return response.data;
};

export const cancelTicket = async (id) => {
  const response = await api.post(`/tickets/${id}/cancel`);
  return response.data;
};

export const skipTicket = async (id) => {
  const response = await api.post(`/tickets/${id}/skip`);
  return response.data;
};

export const noShowTicket = async (id) => {
  const response = await api.post(`/tickets/${id}/no-show`);
  return response.data;
};

export const transferTicket = async (id, targetCounterId) => {
  const response = await api.post(`/tickets/${id}/transfer`, { targetCounterId });
  return response.data;
};

export const getCustomerActiveTickets = async () => {
  const response = await api.get('/tickets/my-active');
  return response.data;
};

export const getCustomerHistoryTickets = async () => {
  const response = await api.get('/tickets/my-history');
  return response.data;
};

export const getBranchQueueSummary = async (branchId) => {
  const response = await api.get(`/tickets/branch/${branchId}/summary`);
  return response.data;
};

