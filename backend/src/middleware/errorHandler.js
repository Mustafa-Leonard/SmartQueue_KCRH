import { errorResponse } from '../utils/apiResponse.js';
import { ZodError } from 'zod';

const errorHandler = (err, req, res, next) => {
  console.error('SERVER ERROR:', err);

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const errorMessages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    return errorResponse(res, 'Validation error', errorMessages, 400);
  }

  // 2. Prisma Database Errors
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      const target = err.meta?.target ? ` (${err.meta.target})` : '';
      return errorResponse(res, `Database unique constraint violation${target}`, [], 409);
    }
    if (err.code === 'P2025') {
      return errorResponse(res, 'Record to update or delete not found', [], 404);
    }
    return errorResponse(res, `Database operation failed: ${err.message}`, [], 400);
  }

  // 3. Unauthorized / JWT Errors
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Unauthorized access: Invalid token', [], 401);
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Session expired: Please log in again', [], 401);
  }

  // 4. Default Internal Server Error
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return errorResponse(res, message, [], err.status || 500);
};

export default errorHandler;
