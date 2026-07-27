import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // Increased limit for testing
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // No practical limit for auth during testing
  message: {
    success: false,
    message: 'Too many login or registration attempts. Please retry after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
