import api from './axios.js';

export const getServices = async () => {
  const response = await api.get('/services');
  return response.data;
};

export const getBranchServices = async (branchId) => {
  const response = await api.get(`/services/branch/${branchId}`);
  return response.data;
};

export const createService = async (data) => {
  const response = await api.post('/services', data);
  return response.data;
};

export const updateService = async (id, data) => {
  const response = await api.put(`/services/${id}`, data);
  return response.data;
};

export const deleteService = async (id) => {
  const response = await api.delete(`/services/${id}`);
  return response.data;
};
