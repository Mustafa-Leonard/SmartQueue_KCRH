import prisma from '../../config/database.js';
import bcrypt from 'bcryptjs';
import config from '../../config/env.js';

// ─── SELECT SHAPE ────────────────────────────────────────────────────────────
const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  assignedCounter: {
    select: {
      id: true,
      name: true,
      number: true,
      status: true,
      branch: { select: { id: true, name: true } }
    }
  }
};

// ─── getAllUsers ──────────────────────────────────────────────────────────────
/**
 * List all users with optional filtering and pagination.
 * @param {Object} filters
 * @param {string} [filters.role]        - Filter by Role enum (ADMIN | STAFF | CUSTOMER)
 * @param {boolean} [filters.isActive]   - Filter by active status
 * @param {string} [filters.search]      - Search by name, email, or phone
 * @param {number} [filters.page=1]      - Page number (1-indexed)
 * @param {number} [filters.limit=20]    - Items per page
 */
export const getAllUsers = async ({
  role,
  isActive,
  search,
  page = 1,
  limit = 20
} = {}) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNumber - 1) * limitNumber;

  const where = {};

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined && isActive !== null && isActive !== '') {
    where.isActive = isActive === true || isActive === 'true';
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [users, total, roleSummary] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userPublicSelect,
      skip,
      take: limitNumber,
      orderBy: { name: 'asc' }
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true }
    })
  ]);

  const roleCounts = Object.fromEntries(roleSummary.map(item => [item.role, item._count._all]));

  return {
    users,
    total,
    roleCounts,
    page: pageNumber,
    limit: limitNumber,
    pages: Math.ceil(total / limitNumber)
  };
};

// ─── getUserById ─────────────────────────────────────────────────────────────
/**
 * Get a single user by ID, including their assigned counter.
 * @param {string} id - User cuid
 */
export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userPublicSelect
  });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
};

// ─── createUser ──────────────────────────────────────────────────────────────
/**
 * Create a new user (admin action). Password is hashed before storage.
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.phone
 * @param {string} data.password  - Plain-text password
 * @param {string} [data.role]    - Defaults to CUSTOMER
 */
export const createUser = async ({ name, email, phone, password, role = 'CUSTOMER' }) => {
  // Check for duplicate email or phone
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] }
  });

  if (existing) {
    const field = existing.email === email ? 'email' : 'phone';
    const err = new Error(`A user with that ${field} already exists`);
    err.statusCode = 409;
    throw err;
  }

  const rounds = Number(config.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, rounds);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role
    },
    select: userPublicSelect
  });

  return user;
};

// ─── updateUser ──────────────────────────────────────────────────────────────
/**
 * Update user profile fields. If password is provided it is re-hashed.
 * @param {string} id   - User ID
 * @param {Object} data - Fields to update
 * @param {string} [actorId] - ID of the admin performing the action
 */
export const updateUser = async (id, data, actorId) => {
  // Ensure user exists
  const existing = await getUserById(id);

  const updateData = { ...data };

  if (updateData.isActive === false) {
    await assertCanDeactivate(existing, actorId);
  }

  if (updateData.password) {
    const rounds = Number(config.BCRYPT_ROUNDS) || 12;
    updateData.password = await bcrypt.hash(updateData.password, rounds);
  }

  // Remove undefined/null keys to avoid accidental overwrites
  Object.keys(updateData).forEach(
    (k) => updateData[k] === undefined && delete updateData[k]
  );

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: userPublicSelect
  });
};

// ─── Deactivation safety guard ───────────────────────────────────────────────
/**
 * Prevent accidental lock-outs:
 *   - an admin cannot deactivate their own account
 *   - the last remaining active ADMIN cannot be deactivated
 * @param {Object} target  - user about to be deactivated (needs id, role, isActive)
 * @param {string} [actorId] - id of the admin performing the action
 */
const assertCanDeactivate = async (target, actorId) => {
  if (actorId && target.id === actorId) {
    const err = new Error('You cannot deactivate your own account');
    err.statusCode = 403;
    throw err;
  }

  if (target.role === 'ADMIN' && target.isActive) {
    const activeAdmins = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true }
    });

    if (activeAdmins <= 1) {
      const err = new Error('Cannot deactivate the last active admin account');
      err.statusCode = 403;
      throw err;
    }
  }
};

// ─── toggleUserActive ────────────────────────────────────────────────────────
/**
 * Toggle a user's isActive status (activate / deactivate).
 * @param {string} id - User ID
 * @param {string} [actorId] - ID of the admin performing the action
 */
export const toggleUserActive = async (id, actorId) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isActive: true, name: true, role: true }
  });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.isActive) {
    await assertCanDeactivate(user, actorId);
  }

  return prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: userPublicSelect
  });
};

// ─── deleteUser ──────────────────────────────────────────────────────────────
/**
 * Soft-delete a user by setting isActive to false.
 * @param {string} id - User ID
 */
export const deleteUser = async (id, actorId) => {
  const existing = await getUserById(id);
  await assertCanDeactivate(existing, actorId);

  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, name: true, isActive: true }
  });
};

// ─── getStaffUsers ────────────────────────────────────────────────────────────
/**
 * Return all STAFF users (active + inactive) for counter assignment UI.
 */
export const getStaffUsers = async () => {
  return prisma.user.findMany({
    where: { role: 'STAFF' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      assignedCounter: {
        select: {
          id: true,
          name: true,
          number: true,
          status: true,
          branch: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { name: 'asc' }
  });
};

// ─── Legacy aliases (keep backward compat with existing calls) ───────────────
export const listUsers = getAllUsers;

export const changeUserRole = async (id, role) => {
  await getUserById(id);
  return prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true }
  });
};

export const deactivateUser = deleteUser;
