import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.NODE_ENV === 'production' ? 600 : 100000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.NODE_ENV === 'production' ? 20 : 10000,
  message: {
    success: false,
    message: 'Too many login or registration attempts. Please retry after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'production' ? 30 : 10000,
  message: {
    success: false,
    message: 'Too many login attempts from this network. Please retry after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
