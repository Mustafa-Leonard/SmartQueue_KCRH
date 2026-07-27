import api from './axios.js';

export const getAuditLogs = async (params = {}) => {
  // Map frontend param names to backend expected params
  const backendParams = { ...params };
  if (backendParams.dateFrom !== undefined) {
    backendParams.startDate = backendParams.dateFrom;
    delete backendParams.dateFrom;
  }
  if (backendParams.dateTo !== undefined) {
    backendParams.endDate = backendParams.dateTo;
    delete backendParams.dateTo;
  }
  const response = await api.get('/audit/logs', { params: backendParams });
  return response.data;
};

export const getActivityLogs = async (params = {}) => {
  const response = await api.get('/audit/activity', { params });
  return response.data;
};

export const getApiLogs = async (params = {}) => {
  const response = await api.get('/audit/api-logs', { params });
  return response.data;
};

