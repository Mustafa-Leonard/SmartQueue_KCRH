// Use Vite env var if provided, fall back to localhost for dev, and use relative path in production
const viteApi = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : null;
export const API_BASE_URL = viteApi || (window?.location?.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');
export const SOCKET_URL = viteApi ? viteApi.replace(/\/api\/?$/i, '') : (window?.location?.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER'
};

export const TICKET_STATUS = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  SERVING: 'SERVING',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  NO_SHOW: 'NO_SHOW',
  TRANSFERRED: 'TRANSFERRED'
};

export const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW'
};

export const COUNTER_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  PAUSED: 'PAUSED'
};
