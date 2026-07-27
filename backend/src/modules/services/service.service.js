import prisma from '../../config/database.js';

// ─── SELECT SHAPE ─────────────────────────────────────────────────────────────
const serviceSelect = {
  id: true,
  name: true,
  description: true,
  estimatedTime: true,
  isActive: true,
  branchId: true,
  createdAt: true,
  updatedAt: true,
  branch: { select: { id: true, name: true, location: true } }
};

// ─── getAllServices ────────────────────────────────────────────────────────────
/**
 * List all services, optionally filtered by branchId.
 * @param {Object} [filters]
 * @param {string} [filters.branchId]   - Filter to a specific branch
 * @param {boolean} [filters.isActive]  - Filter by active status
 */
export const getAllServices = async ({ branchId, isActive } = {}) => {
  const where = {};

  if (branchId) {
    where.branchId = branchId;
  }

  if (isActive !== undefined && isActive !== null && isActive !== '') {
    where.isActive = isActive === true || isActive === 'true';
  }

  return prisma.service.findMany({
    where,
    select: serviceSelect,
    orderBy: [{ branch: { name: 'asc' } }, { name: 'asc' }]
  });
};

// ─── getServiceById ───────────────────────────────────────────────────────────
/**
 * Get a single service by its ID.
 * @param {string} id - Service cuid
 */
export const getServiceById = async (id) => {
  const service = await prisma.service.findUnique({
    where: { id },
    select: {
      ...serviceSelect,
      counters: {
        select: { id: true, name: true, number: true, status: true }
      },
      _count: {
        select: { tickets: true, appointments: true }
      }
    }
  });

  if (!service) {
    const err = new Error('Service not found');
    err.statusCode = 404;
    throw err;
  }

  return service;
};

// ─── getServicesByBranch ──────────────────────────────────────────────────────
/**
 * Get services belonging to a specific branch.
 * @param {string} branchId
 * @param {boolean} [onlyActive=false]
 */
export const getServicesByBranch = async (branchId, onlyActive = false) => {
  return prisma.service.findMany({
    where: {
      branchId,
      ...(onlyActive ? { isActive: true } : {})
    },
    select: serviceSelect,
    orderBy: { name: 'asc' }
  });
};

// ─── createService ────────────────────────────────────────────────────────────
/**
 * Create a new service.
 * @param {Object} data - { name, description?, estimatedTime?, branchId, isActive? }
 */
export const createService = async (data) => {
  // Verify branch exists
  const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
  if (!branch) {
    const err = new Error('Branch not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.service.create({
    data,
    select: serviceSelect
  });
};

// ─── updateService ────────────────────────────────────────────────────────────
/**
 * Update an existing service.
 * @param {string} id   - Service cuid
 * @param {Object} data - Fields to update
 */
export const updateService = async (id, data) => {
  await getServiceById(id);

  return prisma.service.update({
    where: { id },
    data,
    select: serviceSelect
  });
};

// ─── deleteService ────────────────────────────────────────────────────────────
/**
 * Soft-delete a service (sets isActive: false).
 * @param {string} id - Service cuid
 */
export const deleteService = async (id) => {
  await getServiceById(id);

  return prisma.service.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, name: true, isActive: true }
  });
};

// ─── Legacy alias ─────────────────────────────────────────────────────────────
export const listAllServices = () => getAllServices();
export const getServicesByBranchId = getServicesByBranch;
