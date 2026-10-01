import prisma from '../../config/database.js';
import { generateTicketNumber } from '../../utils/generateTicketNumber.js';
import { sendTicketIssuedMessage, sendTicketCalledMessage } from '../notifications/notification.service.js';
import { emitTicketCalled, emitQueueUpdated, emitDisplayRefresh } from '../../events/socketEvents.js';

export const createTicket = async ({ customerId, serviceId, branchId, type = 'WALK_IN' }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Get or open queue
  let queue = await prisma.queue.findUnique({
    where: { branchId_date: { branchId, date: today } }
  });

  if (!queue) {
    queue = await prisma.queue.create({
      data: { branchId, date: today, isOpen: true }
    });
  }

  if (!queue.isOpen) {
    throw new Error('This department queue is closed for today');
  }

  // 2. Calculate position (count waiting)
  const waitingCount = await prisma.ticket.count({
    where: {
      queueId: queue.id,
      status: 'WAITING'
    }
  });

  const position = waitingCount + 1;

  // 3. Generate Ticket Code & Number
  const ticketNumber = await generateTicketNumber(serviceId);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      status: 'WAITING',
      type,
      position,
      waitingBefore: waitingCount,
      customerId,
      serviceId,
      queueId: queue.id
    },
    include: {
      customer: true,
      service: true
    }
  });

  // 4. Notifications
  const waitMin = waitingCount * ticket.service.estimatedTime;
  sendTicketIssuedMessage(ticket.customer, ticket, ticket.service.name, position, waitMin)
    .catch(err => console.error('Ticket SMS send failed:', err.message));

  // 5. Sockets
  emitQueueUpdated(branchId);

  return {
    ticket,
    waitingBefore: waitingCount,
    estimatedWaitMinutes: waitMin
  };
};

export const getTicketProgress = async (ticketCodeOrNumber) => {
  // Try to find by ticketCode (CUID) first, then by ticketNumber
  let ticket = await prisma.ticket.findUnique({
    where: { ticketCode: ticketCodeOrNumber },
    include: {
      service: true,
      customer: { select: { id: true, name: true, phone: true } },
      counter: { select: { name: true, number: true } },
      queue: { include: { branch: { select: { id: true, name: true } } } }
    }
  });

  if (!ticket) {
    // Fallback: try finding by ticketNumber
    ticket = await prisma.ticket.findUnique({
      where: { ticketNumber: ticketCodeOrNumber },
      include: {
        service: true,
        customer: { select: { id: true, name: true, phone: true } },
        counter: { select: { name: true, number: true } },
        queue: { include: { branch: { select: { id: true, name: true } } } }
      }
    });
  }

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Calculate live position
  let livePosition = 0;
  let waitingBefore = 0;

  if (ticket.status === 'WAITING') {
    const aheadCount = await prisma.ticket.count({
      where: {
        queueId: ticket.queueId,
        status: 'WAITING',
        createdAt: { lt: ticket.createdAt }
      }
    });
    livePosition = aheadCount + 1;
    waitingBefore = aheadCount;
  }

  const estimatedWaitMinutes = waitingBefore * ticket.service.estimatedTime;

  return {
    ticket,
    livePosition,
    waitingBefore,
    estimatedWaitMinutes
  };
};

export const listTicketsInBranch = async (branchId, statusList) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.ticket.findMany({
    where: {
      queue: { branchId, date: today },
      ...(statusList ? { status: { in: statusList } } : {})
    },
    include: {
      service: { select: { name: true } },
      customer: { select: { name: true, phone: true } },
      counter: { select: { name: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
};

export const callTicket = async (ticketId, counterId, staffId) => {
  const counter = await prisma.counter.findUnique({
    where: { id: counterId },
    include: { services: true }
  });

  if (!counter || counter.staffId !== staffId) {
    throw new Error('Counter configuration or staff assignment mismatch');
  }

  // Complete any currently serving ticket on this counter first
  await prisma.ticket.updateMany({
    where: { counterId, status: 'SERVING' },
    data: { status: 'COMPLETED', completedAt: new Date() }
  });

  // Call the targeted ticket
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'CALLED',
      counterId,
      calledAt: new Date()
    },
    include: {
      customer: true,
      service: true
    }
  });

  // Send calling SMS alerts
  sendTicketCalledMessage(ticket.customer, ticket, counter.name)
    .catch(err => console.error('Call ticket SMS failed:', err.message));

  // Trigger Sockets
  emitTicketCalled(counter.branchId, ticket.ticketNumber, counter.name, ticket.service.name);
  emitQueueUpdated(counter.branchId);
  emitDisplayRefresh(counter.branchId);

  return ticket;
};

export const serveTicket = async (ticketId) => {
  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'SERVING',
      servedAt: new Date()
    }
  });
};

export const completeTicket = async (ticketId) => {
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date()
    },
    include: { queue: true }
  });

  emitQueueUpdated(ticket.queue.branchId);
  emitDisplayRefresh(ticket.queue.branchId);

  return ticket;
};

export const skipTicket = async (ticketId) => {
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'SKIPPED' },
    include: { queue: true }
  });

  emitQueueUpdated(ticket.queue.branchId);
  emitDisplayRefresh(ticket.queue.branchId);

  return ticket;
};

export const cancelTicket = async (ticketId, customerId) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  if (ticket.customerId !== customerId) {
    throw new Error('You can only cancel your own tickets');
  }

  if (ticket.status !== 'WAITING') {
    throw new Error('You can only cancel tickets that are still waiting');
  }

  const cancelled = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'SKIPPED' },
    include: { queue: true }
  });

  emitQueueUpdated(cancelled.queue.branchId);
  emitDisplayRefresh(cancelled.queue.branchId);

  return cancelled;
};

export const markNoShow = async (ticketId) => {
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'NO_SHOW' },
    include: { queue: true }
  });

  emitQueueUpdated(ticket.queue.branchId);
  emitDisplayRefresh(ticket.queue.branchId);

  return ticket;
};

export const transferTicket = async (ticketId, targetCounterId) => {
  const oldTicket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { queue: true }
  });

  if (!oldTicket) {
    throw new Error('Ticket not found');
  }

  const targetCounter = await prisma.counter.findUnique({
    where: { id: targetCounterId }
  });

  if (!targetCounter) {
    throw new Error('Target counter not found');
  }

  // Update original ticket status to TRANSFERRED
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'TRANSFERRED' }
  });

  // Calculate new position at front of target queue (inserting at pos 1)
  // Shift other waiting tickets position down
  await prisma.ticket.updateMany({
    where: {
      queueId: oldTicket.queueId,
      status: 'WAITING'
    },
    data: {
      position: { increment: 1 }
    }
  });

  // Create new ticket at position 1
  const newTicket = await prisma.ticket.create({
    data: {
      ticketNumber: `${oldTicket.ticketNumber}T`,
      status: 'WAITING',
      type: oldTicket.type,
      position: 1,
      customerId: oldTicket.customerId,
      serviceId: oldTicket.serviceId,
      queueId: oldTicket.queueId,
      counterId: targetCounterId
    }
  });

  emitQueueUpdated(oldTicket.queue.branchId);
  emitDisplayRefresh(oldTicket.queue.branchId);

  return newTicket;
};

export const getActiveTicketsForCustomer = async (customerId) => {
  return prisma.ticket.findMany({
    where: {
      customerId,
      status: { in: ['WAITING', 'CALLED', 'SERVING'] }
    },
    include: {
      service: { select: { name: true, estimatedTime: true } },
      counter: { select: { name: true, number: true } },
      queue: { include: { branch: { select: { id: true, name: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getHistoryTicketsForCustomer = async (customerId, { page = 1, limit = 20, status, date, search } = {}) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(100, Math.max(1, Number(limit) || 20));
  const where = {
    customerId,
    status: { in: ['COMPLETED', 'SKIPPED', 'NO_SHOW', 'TRANSFERRED'] }
  };

  if (status && ['COMPLETED', 'SKIPPED', 'NO_SHOW', 'TRANSFERRED'].includes(status)) {
    where.status = status;
  }
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    where.createdAt = { gte: start, lt: end };
  }
  if (search?.trim()) {
    const term = search.trim();
    const [services, branches] = await Promise.all([
      prisma.service.findMany({ where: { name: { contains: term } }, select: { id: true } }),
      prisma.branch.findMany({ where: { name: { contains: term } }, select: { id: true } })
    ]);
    const queues = branches.length
      ? await prisma.queue.findMany({ where: { branchId: { in: branches.map(branch => branch.id) } }, select: { id: true } })
      : [];
    where.OR = [
      { ticketNumber: { contains: term } },
      { serviceId: { in: services.map(service => service.id) } },
      { queueId: { in: queues.map(queue => queue.id) } }
    ];
  }
  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        service: { select: { name: true, estimatedTime: true } },
        counter: { select: { name: true, number: true } },
        queue: { include: { branch: { select: { name: true } } } },
        feedbacks: { select: { rating: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber
    }),
    prisma.ticket.count({ where })
  ]);

  return {
    tickets,
    pagination: { page: pageNumber, limit: limitNumber, total, pages: Math.ceil(total / limitNumber) }
  };
};

/**
 * Get a summary of the queue for a given branch (department).
 * Returns waiting count, current serving ticket, and open status.
 * Used by JoinQueuePage to show live queue info on department cards.
 */
export const getBranchQueueSummary = async (branchId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find today's queue for this branch
  const queue = await prisma.queue.findUnique({
    where: { branchId_date: { branchId, date: today } }
  });

  if (!queue) {
    return {
      waitingCount: 0,
      servingTicket: null,
      servingCounter: null,
      isOpen: false
    };
  }

  // Count waiting tickets
  const waitingCount = await prisma.ticket.count({
    where: {
      queueId: queue.id,
      status: 'WAITING'
    }
  });

  // Find the currently serving ticket (if any)
  const servingTicket = await prisma.ticket.findFirst({
    where: {
      queueId: queue.id,
      status: { in: ['CALLED', 'SERVING'] }
    },
    orderBy: { calledAt: 'desc' },
    include: {
      counter: { select: { name: true, number: true } }
    }
  });

  return {
    waitingCount,
    servingTicket: servingTicket?.ticketNumber || null,
    servingCounter: servingTicket?.counter?.name || null,
    isOpen: queue.isOpen
  };
};

