import prisma from '../../config/database.js';
import { getIO } from '../../config/socket.js';

/**
 * Create an activity log entry
 */
export const createActivityLog = async ({ userId, type, message, details, ipAddress }) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        type: type || 'ACTION',
        message: message || '',
        details: details ? JSON.stringify(details) : null,
        ipAddress
      }
    });
  } catch (err) {
    console.error('Failed to create activity log:', err.message);
  }
};

/**
 * Create an audit log entry for system-critical actions
 */
export const createAuditLog = async ({ userId, action, entity, entityId, details, ipAddress, userAgent }) => {
  try {
    const log = await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent
      },
      include: {
        user: { select: { id: true, name: true, role: true } }
      }
    });

    // Emit socket event for real-time audit log feed
    try {
      const io = getIO();
      io.emit('audit:new_log', log);
    } catch (socketErr) {
      // Socket may not be initialized yet
      console.debug('Socket emit skipped (not ready):', socketErr.message);
    }

    return log;
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
  }
};

/**
 * Log an API request
 */
export const logApiRequest = async ({ userId, method, path, query, statusCode, duration, ipAddress, userAgent }) => {
  try {
    await prisma.apiLog.create({
      data: {
        userId,
        method,
        path,
        query: query ? JSON.stringify(query) : null,
        statusCode,
        duration,
        ipAddress,
        userAgent
      }
    });
  } catch (err) {
    console.error('Failed to log API request:', err.message);
  }
};

/**
 * Get activity logs with pagination and filtering
 */
export const getActivityLogs = async ({ userId, type, startDate, endDate, page = 1, limit = 50 }) => {
  const where = {};
  
  if (userId) where.userId = userId;
  if (type) where.type = type;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.activityLog.count({ where })
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Get audit logs with pagination and filtering
 */
export const getAuditLogs = async ({ userId, action, entity, startDate, endDate, search, page = 1, limit = 50 }) => {
  const where = {};
  
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }
  if (search) {
    where.OR = [
      { action: { contains: search } },
      { entity: { contains: search } },
      { entityId: { contains: search } },
      { ipAddress: { contains: search } },
      { details: { contains: search } },
      { user: { name: { contains: search } } }
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.auditLog.count({ where })
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
};

