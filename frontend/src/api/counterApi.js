import api from './axios.js';

export const getCounters = async () => {
  const response = await api.get('/counters');
  return response.data;
};

export const getBranchCounters = async (branchId) => {
  const response = await api.get(`/counters/branch/${branchId}`);
  return response.data;
};

export const createCounter = async (data) => {
  const response = await api.post('/counters', data);
  return response.data;
};

export const updateCounter = async (id, data) => {
  const response = await api.put(`/counters/${id}`, data);
  return response.data;
};

export const assignStaff = async (id, staffId) => {
  const response = await api.put(`/counters/${id}/assign-staff`, { staffId });
  return response.data;
};

export const updateStatus = async (id, status) => {
  const response = await api.put(`/counters/${id}/status`, { status });
  return response.data;
};

export const deleteCounter = async (id) => {
  const response = await api.delete(`/counters/${id}`);
  return response.data;
};
