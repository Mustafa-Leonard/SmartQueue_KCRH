import * as queueService from './queue.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { z } from 'zod';

export const openQueueSchema = z.object({
  branchId: z.string().cuid('Provide a valid branch ID')
});

export const getTodayBranchQueue = asyncHandler(async (req, res) => {
  const queue = await queueService.getTodayQueue(req.params.branchId);
  if (!queue) {
    return successResponse(res, 'No active queue exists for this branch today', { queue: null });
  }
  return successResponse(res, 'Queue retrieved successfully', { queue });
});

export const open = asyncHandler(async (req, res) => {
  const queue = await queueService.openQueueForBranch(req.body.branchId);
  return successResponse(res, 'Queue opened successfully', { queue }, 201);
});

export const close = asyncHandler(async (req, res) => {
  const queue = await queueService.closeQueue(req.params.id);
  return successResponse(res, 'Queue closed successfully', { queue });
});
