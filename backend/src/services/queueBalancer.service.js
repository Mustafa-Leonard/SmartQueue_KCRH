/**
 * Advanced Queue Management Service
 * 
 * Implements VIP queue, emergency priority, queue balancing,
 * patient recall, queue pause/resume, wait time prediction, and kiosk mode.
 */

import prisma from '../config/database.js';
import { emitQueueUpdated, emitDisplayRefresh } from '../events/socketEvents.js';

/**
 * Get or create today's queue
 */
const getOrCreateQueue = async (branchId, date) => {
  let queue = await prisma.queue.findUnique({
    where: { branchId_date: { branchId, date } }
  });
  if (!queue) {
    queue = await prisma.queue.create({
      data: { branchId, date, isOpen: true }
    });
  }
  return queue;
};

/**
 * Generate a ticket number with prefix based on type
 */
const generateTicketNumber = async (branchId, serviceId, type) => {
  const prefix = type === 'VIP' ? 'V' : type === 'EMERGENCY' ? 'E' : '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const count = await prisma.ticket.count({
    where: { createdAt: { gte: today } }
  });
  
  const number = String(count + 1).padStart(3, '0');
  return `${prefix}A${number}`;
};

/**
 * Create a ticket with priority (VIP/EMERGENCY)
 */
export const createPriorityTicket = async ({ customerId, serviceId, branchId, type, priority = 0 }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queue = await getOrCreateQueue(branchId, today);
  if (!queue.isOpen || queue.isPaused) {
    throw new Error(`Queue is ${!queue.isOpen ? 'closed' : 'paused'} for this department`);
  }

  // Count higher-priority waiting tickets to position correctly
  const aheadCount = await prisma.ticket.count({
    where: { queueId: queue.id, status: 'WAITING', priority: { gte: priority } }
  });

  const ticketNumber = await generateTicketNumber(branchId, serviceId, type);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      status: 'WAITING',
      type,
      priority,
      position: aheadCount + 1,
      waitingBefore: aheadCount,
      customerId,
      serviceId,
      queueId: queue.id
    },
    include: {
      customer: true,
      service: true
    }
  });

  // Re-calculate positions for other waiting tickets
  await recalculatePositions(queue.id);

  emitQueueUpdated(branchId);
  return { ticket };
};

/**
 * Recalculate positions of all waiting tickets in a queue
 * Based on priority (higher first), then creation time
 */
export const recalculatePositions = async (queueId) => {
  const tickets = await prisma.ticket.findMany({
    where: { queueId, status: 'WAITING' },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' }
    ]
  });

  for (let i = 0; i < tickets.length; i++) {
    if (tickets[i].position !== i + 1) {
      await prisma.ticket.update({
        where: { id: tickets[i].id },
        data: { position: i + 1, waitingBefore: i }
      });
    }
  }
};

/**
 * Balance queue by automatically assigning waiting tickets to available counters
 */
export const autoBalanceQueue = async (branchId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queue = await prisma.queue.findUnique({
    where: { branchId_date: { branchId, date: today } }
  });

  if (!queue) return { balanced: false, message: 'No active queue' };

  const waitingTickets = await prisma.ticket.findMany({
    where: { queueId: queue.id, status: 'WAITING', counterId: null },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }]
  });

  const openCounters = await prisma.counter.findMany({
    where: { branchId, status: 'OPEN' },
    include: { _count: { select: { tickets: true } } }
  });

  if (openCounters.length === 0) {
    return { balanced: false, message: 'No open counters available' };
  }

  let assignments = 0;
  for (const ticket of waitingTickets) {
    // Find least loaded counter
    const sorted = [...openCounters].sort((a, b) => a._count.tickets - b._count.tickets);
    const targetCounter = sorted[0];

    if (targetCounter) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { counterId: targetCounter.id }
      });
      assignments++;
    }
  }

  emitQueueUpdated(branchId);
  emitDisplayRefresh(branchId);

  return { balanced: true, assignments };
};

/**
 * Recall a patient (re-call from NO_SHOW or SKIPPED)
 */
export const recallPatient = async (ticketId) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { queue: true }
  });

  if (!ticket) throw new Error('Ticket not found');
  if (!['NO_SHOW', 'SKIPPED'].includes(ticket.status)) {
    throw new Error('Can only recall NO_SHOW or SKIPPED tickets');
  }

  // Update status back to WAITING
  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'WAITING',
      calledAt: null,
      notes: ticket.notes 
        ? `${ticket.notes} | Recalled from ${ticket.status}`
        : `Recalled from ${ticket.status}`
    }
  });

  // Recalculate positions
  await recalculatePositions(ticket.queueId);

  emitQueueUpdated(ticket.queue.branchId);
  emitDisplayRefresh(ticket.queue.branchId);

  return updated;
};

/**
 * Toggle queue pause/resume
 */
export const toggleQueuePause = async (branchId, pause) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queue = await prisma.queue.findUnique({
    where: { branchId_date: { branchId, date: today } }
  });

  if (!queue) throw new Error('No active queue for today');

  const updated = await prisma.queue.update({
    where: { id: queue.id },
    data: {
      isPaused: pause,
      pausedAt: pause ? new Date() : null
    }
  });

  emitQueueUpdated(branchId);
  return updated;
};

/**
 * Predict wait time based on historical data
 */
export const predictWaitTime = async (branchId, serviceId) => {
  const now = new Date();
  const pastHour = new Date(now.getTime() - 60 * 60 * 1000);

  // Get average serving time from recent completed tickets
  const recentCompleted = await prisma.ticket.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { gte: pastHour },
      ...(serviceId ? { serviceId } : {}),
      queue: { branchId }
    },
    select: {
      createdAt: true,
      completedAt: true
    }
  });

  let avgServiceTime = 15; // default
  if (recentCompleted.length > 0) {
    const totalTime = recentCompleted.reduce((sum, t) => {
      return sum + (new Date(t.completedAt) - new Date(t.createdAt)) / 60000;
    }, 0);
    avgServiceTime = Math.round(totalTime / recentCompleted.length);
  }

  // Count waiting tickets
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const queue = await prisma.queue.findUnique({
    where: { branchId_date: { branchId, date: today } }
  });

  if (!queue) return { waitTimeMinutes: 0, confidence: 'high' };

  const waitingCount = await prisma.ticket.count({
    where: { queueId: queue.id, status: 'WAITING' }
  });

  // Get open counters count
  const openCounters = await prisma.counter.count({
    where: { branchId, status: 'OPEN' }
  });

  const effectiveCounters = Math.max(openCounters, 1);
  const waitTimeMinutes = Math.round((waitingCount / effectiveCounters) * avgServiceTime);

  // Confidence level based on data quantity
  const confidence = recentCompleted.length > 20 ? 'high' 
    : recentCompleted.length > 5 ? 'medium' 
    : 'low';

  return {
    waitTimeMinutes,
    waitingCount,
    openCounters,
    avgServiceTime,
    confidence
  };
};

/**
 * Create a kiosk registration (walk-in patient)
 * Uses inline prisma create to avoid circular dependency
 */
export const kioskRegistration = async ({ name, phone, serviceId, branchId }) => {
  // Find or create patient
  let customer = await prisma.user.findUnique({ where: { phone } });
  
  if (!customer) {
    // Create a temporary patient account
    const bcrypt = (await import('bcryptjs')).default;
    customer = await prisma.user.create({
      data: {
        name: name || 'Kiosk Patient',
        phone,
        email: `kiosk_${phone.replace(/[^0-9]/g, '')}@temp.kcrh.go.ke`,
        password: bcrypt.hashSync('changeme123', 12),
        role: 'CUSTOMER'
      }
    });
  }

  // Create ticket directly without circular import
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const queue = await getOrCreateQueue(branchId, today);
  
  const waitingCount = await prisma.ticket.count({
    where: { queueId: queue.id, status: 'WAITING' }
  });
  
  const ticketNumber = await generateTicketNumber(branchId, serviceId, 'WALK_IN');
  
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      status: 'WAITING',
      type: 'WALK_IN',
      priority: 0,
      position: waitingCount + 1,
      waitingBefore: waitingCount,
      customerId: customer.id,
      serviceId,
      queueId: queue.id
    },
    include: {
      customer: true,
      service: true
    }
  });

  // Log kiosk session
  await prisma.kioskSession.create({
    data: {
      patientId: customer.id,
      action: 'QUEUE_JOIN',
      metadata: JSON.stringify({ serviceId, branchId, ticketNumber: ticket.ticketNumber }),
      branchId
    }
  });

  emitQueueUpdated(branchId);
  emitDisplayRefresh(branchId);

  return { ticket, customer };
};

