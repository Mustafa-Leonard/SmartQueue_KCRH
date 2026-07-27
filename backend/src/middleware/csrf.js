/**
 * CSRF Protection Middleware
 * 
 * Implements double-submit cookie pattern for CSRF protection.
 * Generates a CSRF token cookie and validates it against a header value.
 */

import crypto from 'crypto';
import config from '../config/env.js';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const EXCLUDED_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Generate a random CSRF token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF middleware that validates token on state-changing requests
 */
export const csrfProtection = (req, res, next) => {
  // Skip CSRF check for excluded methods
  if (EXCLUDED_METHODS.includes(req.method)) {
    // Still ensure cookie exists for future requests
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
      const token = generateToken();
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
    }
    return next();
  }

  // Validate CSRF token for state-changing requests
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing. Please refresh and try again.'
    });
  }

  if (cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token mismatch. Possible cross-site request forgery detected.'
    });
  }

  // Rotate token after successful validation
  const newToken = generateToken();
  res.cookie(CSRF_COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
  res.setHeader(CSRF_HEADER_NAME, newToken);

  next();
};

/**
 * Generate a CSRF token for use in forms/requests
 */
export const generateCsrfToken = () => {
  return generateToken();
};

