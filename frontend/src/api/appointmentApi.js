import api from './axios.js';

export const getAppointments = async () => {
  const response = await api.get('/appointments');
  return response.data;
};

export const bookAppointment = async (data) => {
  const response = await api.post('/appointments', data);
  return response.data;
};

export const getAvailableSlots = async (serviceId, date) => {
  const response = await api.get('/appointments/available-slots', {
    params: { serviceId, date }
  });
  return response.data;
};

export const updateStatus = async (id, status) => {
  const response = await api.put(`/appointments/${id}/status`, { status });
  return response.data;
};

export const rescheduleAppointment = async (id, data) => {
  const response = await api.put(`/appointments/${id}/reschedule`, data);
  return response.data;
};
