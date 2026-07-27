import * as serviceService from './service.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { z } from 'zod';

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  description: z.string().optional(),
  estimatedTime: z
    .number()
    .int()
    .min(1, 'Estimated time must be at least 1 minute')
    .optional()
    .default(10),
  branchId: z.string().cuid('Provide a valid branch ID'),
  isActive: z.boolean().optional()
});

export const updateServiceSchema = createServiceSchema
  .omit({ branchId: true })
  .partial();

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/services
 * List all services. Supports optional ?branchId= and ?isActive= filters.
 */
export const getServices = asyncHandler(async (req, res) => {
  const { branchId, isActive } = req.query;
  const services = await serviceService.getAllServices({ branchId, isActive });
  return successResponse(res, 'Services retrieved successfully', { services });
});

/**
 * GET /api/services/:id
 * Get a single service by ID.
 */
export const getService = asyncHandler(async (req, res) => {
  const service = await serviceService.getServiceById(req.params.id);
  return successResponse(res, 'Service retrieved successfully', { service });
});

/**
 * GET /api/services/branch/:branchId
 * Get all services for a specific branch.
 */
export const getBranchServices = asyncHandler(async (req, res) => {
  const onlyActive = !req.user || req.user.role !== 'ADMIN';
  const services = await serviceService.getServicesByBranch(
    req.params.branchId,
    onlyActive
  );
  return successResponse(res, 'Branch services retrieved successfully', { services });
});

/**
 * POST /api/services
 * Create a new service (admin only).
 */
export const create = asyncHandler(async (req, res) => {
  const service = await serviceService.createService(req.body);
  return successResponse(res, 'Service created successfully', { service }, 201);
});

/**
 * PUT /api/services/:id
 * Update an existing service (admin only).
 */
export const update = asyncHandler(async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body);
  return successResponse(res, 'Service updated successfully', { service });
});

/**
 * DELETE /api/services/:id
 * Soft-delete a service (admin only).
 */
export const remove = asyncHandler(async (req, res) => {
  const service = await serviceService.deleteService(req.params.id);
  return successResponse(res, 'Service deactivated successfully', { service });
});
