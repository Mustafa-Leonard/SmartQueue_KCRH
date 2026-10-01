import prisma from '../../config/database.js';

export const getTodayQueue = async (branchId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let queue = await prisma.queue.findFirst({
    where: {
      branchId,
      date: today
    },
    include: {
      tickets: {
        where: { status: { in: ['WAITING', 'CALLED', 'SERVING'] } },
        orderBy: { position: 'asc' },
        include: {
          service: { select: { name: true } },
          customer: { select: { name: true } },
          counter: { select: { name: true } }
        }
      }
    }
  });

  return queue;
};

export const openQueueForBranch = async (branchId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already open
  const existing = await prisma.queue.findUnique({
    where: {
      branchId_date: {
        branchId,
        date: today
      }
    }
  });

  if (existing) {
    if (!existing.isOpen) {
      return prisma.queue.update({
        where: { id: existing.id },
        data: { isOpen: true }
      });
    }
    return existing;
  }

  return prisma.queue.create({
    data: {
      branchId,
      date: today,
      isOpen: true
    }
  });
};

export const closeQueue = async (queueId) => {
  return prisma.queue.update({
    where: { id: queueId },
    data: { isOpen: false }
  });
};
