import * as feedbackService from './feedback.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { z } from 'zod';

export const createFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
  category: z.enum(['GENERAL', 'SERVICE', 'WAIT_TIME', 'STAFF', 'FACILITY', 'COMMUNICATION', 'ACCESSIBILITY', 'COMPLAINT', 'SUGGESTION']).optional(),
  ticketId: z.string().cuid().optional()
});

export const create = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.createFeedback({
    ...req.body,
    customerId: req.user.id
  });
  return successResponse(res, 'Feedback submitted successfully', { feedback }, 201);
});

export const getAll = asyncHandler(async (req, res) => {
  const { category, isRead, page, limit } = req.query;
  const result = await feedbackService.getAllFeedback({ category, isRead, page, limit });
  return successResponse(res, 'Feedback retrieved successfully', {
    feedbacks: result.feedbacks,
    pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages }
  });
});

export const getMy = asyncHandler(async (req, res) => {
  const feedbacks = await feedbackService.getMyFeedback(req.user.id);
  return successResponse(res, 'My feedback retrieved successfully', { feedbacks });
});

export const markRead = asyncHandler(async (req, res) => {
  await feedbackService.markAsRead(req.params.id);
  return successResponse(res, 'Feedback marked as read');
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await feedbackService.getFeedbackStats();
  return successResponse(res, 'Feedback stats retrieved', { stats });
});

