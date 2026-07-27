import * as branchService from './branch.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { z } from 'zod';

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const createBranchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  description: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().optional()
});

export const updateBranchSchema = createBranchSchema.partial();

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/branches
 * List all branches. Non-admins only see active branches.
 */
export const getBranches = asyncHandler(async (req, res) => {
  const onlyActive = !req.user || req.user.role !== 'ADMIN';
  const branches = await branchService.getAllBranches(onlyActive);
  return successResponse(res, 'Branches retrieved successfully', { branches });
});

/**
 * GET /api/branches/:id
 * Get a single branch by ID with its services and counters.
 */
export const getBranch = asyncHandler(async (req, res) => {
  const branch = await branchService.getBranchById(req.params.id);
  return successResponse(res, 'Branch retrieved successfully', { branch });
});

/**
 * GET /api/branches/:id/stats
 * Get a branch with live queue statistics for today.
 */
export const getBranchStats = asyncHandler(async (req, res) => {
  const branch = await branchService.getBranchWithStats(req.params.id);
  return successResponse(res, 'Branch statistics retrieved successfully', { branch });
});

/**
 * POST /api/branches
 * Create a new branch (admin only).
 */
export const create = asyncHandler(async (req, res) => {
  const branch = await branchService.createBranch(req.body);
  return successResponse(res, 'Branch created successfully', { branch }, 201);
});

/**
 * PUT /api/branches/:id
 * Update an existing branch (admin only).
 */
export const update = asyncHandler(async (req, res) => {
  const branch = await branchService.updateBranch(req.params.id, req.body);
  return successResponse(res, 'Branch updated successfully', { branch });
});

/**
 * PATCH /api/branches/:id
 * Partial update of a branch (admin only) — same handler as PUT.
 */
export const patch = asyncHandler(async (req, res) => {
  const branch = await branchService.updateBranch(req.params.id, req.body);
  return successResponse(res, 'Branch updated successfully', { branch });
});

/**
 * DELETE /api/branches/:id
 * Soft-delete a branch (admin only).
 */
export const remove = asyncHandler(async (req, res) => {
  const branch = await branchService.deleteBranch(req.params.id);
  return successResponse(res, 'Branch deactivated successfully', { branch });
});
