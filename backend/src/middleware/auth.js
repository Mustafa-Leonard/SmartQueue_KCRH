import { verifyAccessToken } from '../utils/jwt.js';
import prisma from '../config/database.js';
import { errorResponse } from '../utils/apiResponse.js';

const authenticateRequest = async (req, res, next, required) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return required ? errorResponse(res, 'Authentication token required', [], 401) : next();
    }

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true }
    });

    if (!user) {
      return errorResponse(res, 'User no longer exists', [], 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'User account is deactivated', [], 403);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth protect middleware error:', error.message);
    return errorResponse(res, 'Invalid or expired token', [], 401);
  }
};

export const protect = (req, res, next) => authenticateRequest(req, res, next, true);
export const optionalProtect = (req, res, next) => authenticateRequest(req, res, next, false);

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 'Permission denied: Insufficient privileges', [], 403);
    }
    next();
  };
};
export const authorizeRole = restrictTo; // Alias
