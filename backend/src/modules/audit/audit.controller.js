import * as auditService from './audit.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const getActivityLogs = asyncHandler(async (req, res) => {
  const { userId, type, startDate, endDate, page, limit } = req.query;
  const result = await auditService.getActivityLogs({
    userId,
    type,
    startDate,
    endDate,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50
  });
  return successResponse(res, 'Activity logs retrieved successfully', result);
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { userId, action, entity, startDate, endDate, search, page, limit } = req.query;
  const result = await auditService.getAuditLogs({
    userId,
    action,
    entity,
    startDate,
    endDate,
    search,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50
  });
  return successResponse(res, 'Audit logs retrieved successfully', result);
});
