import * as hmisService from './hmis.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { z } from 'zod';

export const lookupSchema = z.object({
  hospitalNumber: z.string().optional(),
  mrn: z.string().optional(),
  nationalId: z.string().optional(),
  shaNumber: z.string().optional(),
  phone: z.string().optional()
}).refine(data => data.hospitalNumber || data.mrn || data.nationalId || data.shaNumber || data.phone, {
  message: 'At least one identifier (hospitalNumber, mrn, nationalId, shaNumber, or phone) is required'
});

export const syncAppointmentSchema = z.object({
  externalId: z.string(),
  patientId: z.string(),
  serviceId: z.string(),
  date: z.string(),
  timeSlot: z.string(),
  notes: z.string().optional()
});

export const syncDepartmentsSchema = z.object({
  departments: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    isActive: z.boolean().optional()
  }))
});

export const lookup = asyncHandler(async (req, res) => {
  const result = await hmisService.lookupPatient(req.body);
  return successResponse(res, 'Patient lookup completed', result);
});

export const syncAppointment = asyncHandler(async (req, res) => {
  const appointment = await hmisService.syncAppointment(req.body);
  return successResponse(res, 'Appointment synced successfully', { appointment });
});

export const pushVisit = asyncHandler(async (req, res) => {
  const { ticketId } = req.body;
  if (!ticketId) {
    return errorResponse(res, 'ticketId is required', [], 400);
  }
  const visit = await hmisService.pushCompletedVisit(ticketId);
  return successResponse(res, 'Visit pushed to HMIS', { visit });
});

export const syncDepartments = asyncHandler(async (req, res) => {
  const branches = await hmisService.syncDepartments(req.body.departments);
  return successResponse(res, 'Departments synced successfully', { branches });
});

export const getLogs = asyncHandler(async (req, res) => {
  const { system, status, page, limit } = req.query;
  const result = await hmisService.getIntegrationLogs({
    system,
    status,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50
  });
  return successResponse(res, 'Integration logs retrieved', result);
});
