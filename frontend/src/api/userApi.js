import api from './axios.js';

export const getUsers = async (role, search) => {
  const params = {};
  if (role) params.role = role;
  if (search) params.search = search;
  const response = await api.get('/users', { params });
  return response.data;
};

export const getUser = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const changeUserRole = async (id, role) => {
  const response = await api.put(`/users/${id}/role`, { role });
  return response.data;
};

export const deactivateUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post('/users', data);
  return response.data;
};

export const toggleUserActive = async (id) => {
  const response = await api.patch(`/users/${id}/toggle-active`);
  return response.data;
};

export const getStaff = async () => {
  const response = await api.get('/users/staff/list');
  return response.data;
};

