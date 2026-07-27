import api from './axios.js';

export const getOverviewKPIs = async (branchId) => {
  const params = branchId ? { branchId } : {};
  const response = await api.get('/analytics/overview', { params });
  return response.data;
};

export const getTicketsToday = async (branchId) => {
  const params = branchId ? { branchId } : {};
  const response = await api.get('/analytics/tickets-today', { params });
  return response.data;
};

export const getWaitTimes = async (branchId, days = 7) => {
  const params = { days };
  if (branchId) {
    params.branchId = branchId;
  }
  const response = await api.get('/analytics/wait-times', { params });
  return response.data;
};

export const getCounterPerf = async (branchId) => {
  const params = branchId ? { branchId } : {};
  const response = await api.get('/analytics/counter-perf', { params });
  return response.data;
};

export const getServiceDistribution = async (branchId) => {
  const params = branchId ? { branchId } : {};
  const response = await api.get('/analytics/service-distribution', { params });
  return response.data;
};
