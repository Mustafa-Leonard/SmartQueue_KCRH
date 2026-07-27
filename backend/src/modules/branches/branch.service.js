import prisma from '../../config/database.js';

// ─── getAllBranches ───────────────────────────────────────────────────────────
/**
 * Return all branches. Optionally filter to active-only.
 * @param {boolean} [onlyActive=false]
 */
export const getAllBranches = async (onlyActive = false) => {
  return prisma.branch.findMany({
    where: onlyActive ? { isActive: true } : {},
    include: {
      services: {
        where: { isActive: true },
        select: { id: true, name: true, estimatedTime: true }
      },
      _count: {
        select: { counters: true, queues: true }
      }
    },
    orderBy: { name: 'asc' }
  });
};

// ─── getBranchById ────────────────────────────────────────────────────────────
/**
 * Get a single branch with its services and counters (including assigned staff).
 * @param {string} id - Branch cuid
 */
export const getBranchById = async (id) => {
  const branch = await prisma.branch.findUnique({
    where: { id },
    include: {
      services: {
        orderBy: { name: 'asc' }
      },
      counters: {
        include: {
          staff: { select: { id: true, name: true, email: true } },
          services: { select: { id: true, name: true } }
        },
        orderBy: { number: 'asc' }
      },
      _count: {
        select: { services: true, counters: true, queues: true }
      }
    }
  });

  if (!branch) {
    const err = new Error('Branch not found');
    err.statusCode = 404;
    throw err;
  }

  return branch;
};

// ─── getBranchWithStats ───────────────────────────────────────────────────────
/**
 * Get a branch with live operational statistics for today's queue.
 * @param {string} id - Branch cuid
 */
export const getBranchWithStats = async (id) => {
  const branch = await getBranchById(id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Today's queue for this branch
  const queue = await prisma.queue.findUnique({
    where: { branchId_date: { branchId: id, date: today } }
  });

  let stats = {
    isQueueOpen: false,
    totalTicketsToday: 0,
    waitingCount: 0,
    servingCount: 0,
    completedCount: 0,
    skippedCount: 0,
    openCounters: 0
  };

  if (queue) {
    const [ticketCounts, openCounters] = await Promise.all([
      prisma.ticket.groupBy({
        by: ['status'],
        where: { queueId: queue.id },
        _count: { status: true }
      }),
      prisma.counter.count({
        where: { branchId: id, status: 'OPEN' }
      })
    ]);

    const countByStatus = {};
    ticketCounts.forEach((tc) => {
      countByStatus[tc.status] = tc._count.status;
    });

    stats = {
      isQueueOpen: queue.isOpen,
      totalTicketsToday: Object.values(countByStatus).reduce((a, b) => a + b, 0),
      waitingCount: countByStatus.WAITING || 0,
      servingCount: countByStatus.SERVING || 0,
      completedCount: countByStatus.COMPLETED || 0,
      skippedCount: countByStatus.SKIPPED || 0,
      noShowCount: countByStatus.NO_SHOW || 0,
      openCounters
    };
  }

  return { ...branch, stats };
};

// ─── createBranch ─────────────────────────────────────────────────────────────
/**
 * Create a new branch.
 * @param {Object} data - { name, description?, location?, isActive? }
 */
export const createBranch = async (data) => {
  return prisma.branch.create({
    data,
    include: {
      _count: { select: { services: true, counters: true } }
    }
  });
};

// ─── updateBranch ─────────────────────────────────────────────────────────────
/**
 * Update an existing branch.
 * @param {string} id   - Branch cuid
 * @param {Object} data - Fields to update
 */
export const updateBranch = async (id, data) => {
  // Verify it exists first
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Branch not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.branch.update({
    where: { id },
    data,
    include: {
      _count: { select: { services: true, counters: true } }
    }
  });
};

// ─── deleteBranch ─────────────────────────────────────────────────────────────
/**
 * Soft-delete a branch (sets isActive: false).
 * @param {string} id - Branch cuid
 */
export const deleteBranch = async (id) => {
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Branch not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.branch.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, name: true, isActive: true }
  });
};
