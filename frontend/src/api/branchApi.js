import api from './axios.js';

export const getBranches = async () => {
  const response = await api.get('/branches');
  return response.data;
};

export const createBranch = async (data) => {
  const response = await api.post('/branches', data);
  return response.data;
};

export const updateBranch = async (id, data) => {
  const response = await api.put(`/branches/${id}`, data);
  return response.data;
};

export const deleteBranch = async (id) => {
  const response = await api.delete(`/branches/${id}`);
  return response.data;
};
