import prisma from '../../config/database.js';

export const createFeedback = async ({ rating, comment, category, ticketId, customerId }) => {
  if (rating < 1 || rating > 5) {
    const err = new Error('Rating must be between 1 and 5');
    err.statusCode = 400;
    throw err;
  }

  return prisma.feedback.create({
    data: {
      rating,
      comment,
      category: category || 'GENERAL',
      ticketId,
      customerId
    },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      ticket: {
        select: {
          ticketNumber: true,
          service: { select: { name: true } }
        }
      }
    }
  });
};

export const getAllFeedback = async ({ category, isRead, page = 1, limit = 20 } = {}) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNumber - 1) * limitNumber;
  const where = {};

  if (category) where.category = category;
  if (isRead !== undefined && isRead !== null && isRead !== '') {
    where.isRead = isRead === true || isRead === 'true';
  }

  const [feedbacks, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        ticket: {
          select: {
            ticketNumber: true,
            service: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNumber
    }),
    prisma.feedback.count({ where })
  ]);

  return {
    feedbacks,
    total,
    page: pageNumber,
    limit: limitNumber,
    pages: Math.ceil(total / limitNumber)
  };
};

export const getMyFeedback = async (customerId) => {
  return prisma.feedback.findMany({
    where: { customerId },
    include: {
      ticket: {
        select: {
          ticketNumber: true,
          service: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const markAsRead = async (id) => {
  const feedback = await prisma.feedback.findUnique({ where: { id } });
  if (!feedback) {
    const err = new Error('Feedback not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.feedback.update({
    where: { id },
    data: { isRead: true }
  });
};

export const getFeedbackStats = async () => {
  const [ratingSummary, ratingGroups, unread] = await Promise.all([
    prisma.feedback.aggregate({
      _count: { _all: true },
      _avg: { rating: true }
    }),
    prisma.feedback.groupBy({
      by: ['rating'],
      _count: { _all: true }
    }),
    prisma.feedback.count({ where: { isRead: false } })
  ]);

  const total = ratingSummary._count._all;
  const avgRating = ratingSummary._avg.rating ? Number(ratingSummary._avg.rating.toFixed(1)) : 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingGroups.forEach(({ rating, _count }) => { distribution[rating] = _count._all; });

  return { total, unread, avgRating, distribution };
};

