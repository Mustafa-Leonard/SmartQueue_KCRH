import api from './axios.js';

export const getTasks = async (filters = {}) => {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.assignedTo) params.assignedTo = filters.assignedTo;
  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.search) params.search = filters.search;
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const getMyTasks = async () => {
  const response = await api.get('/tasks/my');
  return response.data;
};

export const getTask = async (id) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data) => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const updateTask = async (id, data) => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const updateTaskStatus = async (id, status) => {
  const response = await api.patch(`/tasks/${id}/status`, { status });
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

