import * as userService from './user.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { z } from 'zod';

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Provide a valid email address'),
  phone: z.string().min(5, 'Provide a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'STAFF', 'CUSTOMER']).optional()
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(5).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'STAFF', 'CUSTOMER']).optional(),
  isActive: z.boolean().optional()
});

export const changeRoleSchema = z.object({
  role: z.enum(['ADMIN', 'STAFF', 'CUSTOMER'])
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/users
 * List all users with optional filters and pagination.
 * Query params: role, isActive, search, page, limit
 */
export const getAll = asyncHandler(async (req, res) => {
  const { role, isActive, search, page = 1, limit = 20 } = req.query;

  const result = await userService.getAllUsers({
    role,
    isActive,
    search,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10)
  });

  return successResponse(res, 'Users retrieved successfully', {
    users: result.users,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: result.pages
    }
  });
});

// Keep alias for backward compat with any references to `getUsers`
export const getUsers = getAll;

/**
 * GET /api/users/:id
 * Get a single user by ID.
 */
export const getOne = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return successResponse(res, 'User retrieved successfully', { user });
});

// Alias
export const getUser = getOne;

/**
 * POST /api/users
 * Create a new user (admin only).
 */
export const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  return successResponse(res, 'User created successfully', { user }, 201);
});

/**
 * PUT /api/users/:id
 * Update a user's profile.
 */
export const update = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user?.id);
  return successResponse(res, 'User updated successfully', { user });
});

/**
 * PATCH /api/users/:id/toggle-active
 * Toggle user active status (activate / deactivate).
 */
export const toggleActive = asyncHandler(async (req, res) => {
  const user = await userService.toggleUserActive(req.params.id, req.user?.id);
  const msg = user.isActive ? 'User activated successfully' : 'User deactivated successfully';
  return successResponse(res, msg, { user });
});

/**
 * DELETE /api/users/:id
 * Soft-delete a user (sets isActive: false).
 */
export const remove = asyncHandler(async (req, res) => {
  const user = await userService.deleteUser(req.params.id, req.user?.id);
  return successResponse(res, 'User deleted successfully', { user });
});

/**
 * GET /api/users/staff/list
 * Return all STAFF users for counter assignment.
 */
export const getStaff = asyncHandler(async (req, res) => {
  const staff = await userService.getStaffUsers();
  return successResponse(res, 'Staff users retrieved successfully', { staff });
});

/**
 * PUT /api/users/:id/role
 * Change a user's role.
 */
export const changeRole = asyncHandler(async (req, res) => {
  const user = await userService.changeUserRole(req.params.id, req.body.role);
  return successResponse(res, 'User role updated successfully', { user });
});
