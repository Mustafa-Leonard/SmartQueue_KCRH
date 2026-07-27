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
  const skip = (Number(page) - 1) * Number(limit);
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
      take: Number(limit)
    }),
    prisma.feedback.count({ where })
  ]);

  return {
    feedbacks,
    total,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit))
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
  const allFeedback = await prisma.feedback.findMany({
    select: { rating: true }
  });

  const total = allFeedback.length;
  const avgRating = total > 0
    ? (allFeedback.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1)
    : 0;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allFeedback.forEach(f => { distribution[f.rating]++; });

  return {
    total,
    avgRating: Number(avgRating),
    distribution
  };
};

