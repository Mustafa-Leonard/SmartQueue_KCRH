import * as analyticsService from './analytics.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const getKPIs = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const kpis = await analyticsService.getOverviewKPIs(branchId);
  return successResponse(res, 'Overview KPIs retrieved successfully', kpis);
});

export const getHourlyBreakdown = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const breakdown = await analyticsService.getTicketsTodayBreakdown(branchId);
  return successResponse(res, 'Hourly breakdown retrieved successfully', breakdown);
});

export const getWaitTrends = asyncHandler(async (req, res) => {
  const { branchId, days = 7 } = req.query;
  const trends = await analyticsService.getWaitTimeTrends(branchId, parseInt(days, 10));
  return successResponse(res, 'Wait time trends retrieved successfully', trends);
});

export const getCounterPerf = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const performance = await analyticsService.getCounterPerformance(branchId);
  return successResponse(res, 'Counter performance retrieved successfully', performance);
});

export const getServiceDist = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const distribution = await analyticsService.getServiceDistribution(branchId);
  return successResponse(res, 'Service distribution retrieved successfully', { distribution });
});
