import prisma from '../../config/database.js';

// ─── SELECT SHAPE ─────────────────────────────────────────────────────────────
const counterInclude = {
  branch: { select: { id: true, name: true, location: true } },
  staff: { select: { id: true, name: true, email: true, phone: true } }
};

// ─── getAllCounters ───────────────────────────────────────────────────────────
/**
 * List all counters, optionally filtered by branchId.
 * @param {Object} [filters]
 * @param {string} [filters.branchId] - Filter to a specific branch
 */
export const getAllCounters = async ({ branchId } = {}) => {
  const where = branchId ? { branchId } : {};

  return prisma.counter.findMany({
    where,
    include: counterInclude,
    orderBy: [{ branchId: 'asc' }, { number: 'asc' }]
  });
};

// ─── getCounterById ───────────────────────────────────────────────────────────
/**
 * Get a single counter by ID.
 * @param {string} id - Counter cuid
 */
export const getCounterById = async (id) => {
  const counter = await prisma.counter.findUnique({
    where: { id },
    include: {
      ...counterInclude,
      tickets: {
        where: { status: { in: ['WAITING', 'CALLED', 'SERVING'] } },
        orderBy: { createdAt: 'asc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          service: { select: { id: true, name: true } }
        }
      }
    }
  });

  if (!counter) {
    const err = new Error('Counter not found');
    err.statusCode = 404;
    throw err;
  }

  return counter;
};

// ─── getCounterByStaff ────────────────────────────────────────────────────────
/**
 * Get the counter currently assigned to a specific staff member.
 * @param {string} staffId - Staff user cuid
 */
export const getCounterByStaff = async (staffId) => {
  const counter = await prisma.counter.findUnique({
    where: { staffId },
    include: {
      ...counterInclude,
      tickets: {
        where: { status: { in: ['WAITING', 'CALLED', 'SERVING'] } },
        orderBy: { createdAt: 'asc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          service: { select: { id: true, name: true } }
        }
      }
    }
  });

  if (!counter) {
    const err = new Error('No counter assigned to this staff member');
    err.statusCode = 404;
    throw err;
  }

  return counter;
};

// ─── getCountersByBranch ──────────────────────────────────────────────────────
/**
 * List all counters in a branch (backward-compat helper).
 * @param {string} branchId
 */
export const getCountersByBranch = async (branchId) => {
  return prisma.counter.findMany({
    where: { branchId },
    include: counterInclude,
    orderBy: { number: 'asc' }
  });
};

// ─── createCounter ────────────────────────────────────────────────────────────
/**
 * Create a new counter.
 * @param {Object} data
 * @param {string} data.name
 * @param {number} data.number
 * @param {string} data.branchId
 * @param {string[]} [data.serviceIds]
 */
export const createCounter = async ({ name, number, branchId, serviceIds = [] }) => {
  // Verify branch exists
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) {
    const err = new Error('Branch not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.counter.create({
    data: {
      name,
      number,
      branchId,
      services: JSON.stringify(serviceIds)
    },
    include: counterInclude
  });
};

// ─── updateCounter ────────────────────────────────────────────────────────────
/**
 * Update counter name/number and replace its service connections.
 * @param {string} id
 * @param {Object} data
 * @param {string} [data.name]
 * @param {number} [data.number]
 * @param {string[]} [data.serviceIds]
 */
export const updateCounter = async (id, { name, number, serviceIds }) => {
  await getCounterById(id);

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (number !== undefined) updateData.number = number;
  if (serviceIds !== undefined) {
    updateData.services = JSON.stringify(serviceIds);
  }

  return prisma.counter.update({
    where: { id },
    data: updateData,
    include: counterInclude
  });
};

// ─── deleteCounter ────────────────────────────────────────────────────────────
/**
 * Hard-delete a counter (only if no active tickets).
 * @param {string} id - Counter cuid
 */
export const deleteCounter = async (id) => {
  await getCounterById(id);

  // Safety check: no active tickets
  const activeTickets = await prisma.ticket.count({
    where: { counterId: id, status: { in: ['WAITING', 'CALLED', 'SERVING'] } }
  });

  if (activeTickets > 0) {
    const err = new Error('Cannot delete counter with active tickets');
    err.statusCode = 409;
    throw err;
  }

  return prisma.counter.delete({ where: { id } });
};

// ─── updateCounterStatus ──────────────────────────────────────────────────────
/**
 * Update a counter's operational status.
 * @param {string} id     - Counter cuid
 * @param {string} status - 'OPEN' | 'CLOSED' | 'PAUSED'
 */
export const updateCounterStatus = async (id, status) => {
  await getCounterById(id);

  return prisma.counter.update({
    where: { id },
    data: { status },
    include: counterInclude
  });
};

// ─── assignStaff ─────────────────────────────────────────────────────────────
/**
 * Assign a staff member to a counter.
 * Removes any existing assignment the staff member already has.
 * @param {string} counterId - Counter cuid
 * @param {string} staffId   - Staff user cuid
 */
export const assignStaff = async (counterId, staffId) => {
  await getCounterById(counterId);

  // If this staff is already assigned elsewhere, unassign them first
  await prisma.counter.updateMany({
    where: { staffId, NOT: { id: counterId } },
    data: { staffId: null, status: 'CLOSED' }
  });

  return prisma.counter.update({
    where: { id: counterId },
    data: { staffId },
    include: counterInclude
  });
};

// ─── unassignStaff ────────────────────────────────────────────────────────────
/**
 * Remove staff assignment from a counter and close it.
 * @param {string} counterId - Counter cuid
 */
export const unassignStaff = async (counterId) => {
  await getCounterById(counterId);

  return prisma.counter.update({
    where: { id: counterId },
    data: { staffId: null, status: 'CLOSED' },
    include: counterInclude
  });
};

// ─── Legacy aliases ───────────────────────────────────────────────────────────
export const listAllCounters = () => getAllCounters();
export const assignStaffToCounter = assignStaff;
