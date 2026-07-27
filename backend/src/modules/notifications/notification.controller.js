import prisma from '../../config/database.js';
import { successResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const getNotificationsLog = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (status) {
    filter.status = status;
  }
  if (type) {
    filter.type = type;
  }

  // Non-admin users only see their own notifications
  if (req.user.role !== 'ADMIN') {
    filter.userId = req.user.id;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        }
      }
    }),
    prisma.notification.count({ where: filter })
  ]);

  return successResponse(res, 'Notifications log retrieved successfully', {
    notifications,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    throw err;
  }

  // Only allow marking own notifications or admin
  if (req.user.role !== 'ADMIN' && notification.userId !== req.user.id) {
    const err = new Error('Not authorized to update this notification');
    err.statusCode = 403;
    throw err;
  }

  await prisma.notification.update({
    where: { id },
    data: { status: 'READ', readAt: new Date() }
  });

  return successResponse(res, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const where = req.user.role !== 'ADMIN'
    ? { userId: req.user.id, status: { not: 'READ' } }
    : { status: { not: 'READ' } };

  await prisma.notification.updateMany({
    where,
    data: { status: 'READ', readAt: new Date() }
  });

  return successResponse(res, 'All notifications marked as read');
});
