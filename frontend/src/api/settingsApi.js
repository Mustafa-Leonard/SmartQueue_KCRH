import api from './axios.js';

export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const upsertSetting = async (key, value, description) => {
  const response = await api.post('/settings', { key, value, description });
  return response.data;
};

export const deleteSetting = async (key) => {
  const response = await api.delete(`/settings/${key}`);
  return response.data;
};

