import * as counterService from './counter.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { z } from 'zod';

export const createCounterSchema = z.object({
  name: z.string().min(2, 'Counter label must be at least 2 characters'),
  number: z.number().int().min(1, 'Counter number must be 1 or higher'),
  branchId: z.string().cuid('Provide a valid branch ID'),
  serviceIds: z.array(z.string()).optional()
});

export const updateCounterSchema = z.object({
  name: z.string().min(2).optional(),
  number: z.number().int().min(1).optional(),
  serviceIds: z.array(z.string()).optional()
});

export const statusSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED', 'PAUSED'])
});

export const assignStaffSchema = z.object({
  staffId: z.string().cuid('Provide a valid staff user ID').nullable()
});

export const getCounters = asyncHandler(async (req, res) => {
  const counters = await counterService.listAllCounters();
  return successResponse(res, 'Counters retrieved successfully', { counters });
});

export const getBranchCounters = asyncHandler(async (req, res) => {
  const counters = await counterService.getCountersByBranch(req.params.branchId);
  return successResponse(res, 'Branch counters retrieved successfully', { counters });
});

export const create = asyncHandler(async (req, res) => {
  const counter = await counterService.createCounter(req.body);
  return successResponse(res, 'Counter created successfully', { counter }, 201);
});

export const update = asyncHandler(async (req, res) => {
  const counter = await counterService.updateCounter(req.params.id, req.body);
  return successResponse(res, 'Counter updated successfully', { counter });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const counter = await counterService.updateCounterStatus(req.params.id, req.body.status);
  return successResponse(res, 'Counter status updated successfully', { counter });
});

export const assignStaff = asyncHandler(async (req, res) => {
  const counter = await counterService.assignStaffToCounter(req.params.id, req.body.staffId);
  return successResponse(res, 'Staff assignment updated successfully', { counter });
});

export const remove = asyncHandler(async (req, res) => {
  await counterService.deleteCounter(req.params.id);
  return successResponse(res, 'Counter deleted successfully');
});
