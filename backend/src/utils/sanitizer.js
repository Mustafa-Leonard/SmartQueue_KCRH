/**
 * Input Sanitization & XSS Prevention Utilities
 * 
 * Functions to sanitize user input and prevent XSS attacks.
 */

/**
 * Strip HTML tags and dangerous characters from a string
 */
export const stripHtml = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<[^>]*>/g, '')          // Remove HTML tags
    .replace(/[<>"'&]/g, '')          // Remove dangerous characters
    .replace(/javascript:/gi, '')     // Remove javascript: protocol
    .replace(/on\w+=/gi, '')          // Remove event handlers
    .replace(/[\\$`]/g, '')           // Remove shell metacharacters
    .trim();
};

/**
 * Sanitize a string for safe display (allow some safe HTML like <b>, <i>)
 */
export const sanitizeDisplay = (input) => {
  if (typeof input !== 'string') return input;
  // Allow only basic safe tags
  return input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*(on\w+\s*=|javascript:)[^>]*>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>[\s\S]*?<\/embed>/gi, '')
    .trim();
};

/**
 * Recursively sanitize all string fields in an object
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = stripHtml(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Sanitize request body middleware
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Validate and sanitize phone number (E.164 format)
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Assume Kenyan number if starts with 0
    if (cleaned.startsWith('0')) {
      cleaned = '+254' + cleaned.slice(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '+254' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

