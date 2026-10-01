import * as ticketService from './ticket.service.js';
import prisma from '../../config/database.js';
import { successResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { z } from 'zod';

export const joinQueueSchema = z.object({
  serviceId: z.string().cuid('Provide a valid service ID'),
  branchId: z.string().cuid('Provide a valid branch ID'),
  type: z.enum(['WALK_IN', 'APPOINTMENT']).optional()
});

export const transferSchema = z.object({
  targetCounterId: z.string().cuid('Provide a valid counter ID')
});

export const join = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const result = await ticketService.createTicket({
    customerId,
    serviceId: req.body.serviceId,
    branchId: req.body.branchId,
    type: req.body.type
  });

  return successResponse(res, 'Successfully joined the queue', result, 201);
});

export const track = asyncHandler(async (req, res) => {
  const result = await ticketService.getTicketProgress(req.params.ticketCode);
  return successResponse(res, 'Ticket status retrieved', result);
});

export const getBranchTickets = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const statusList = status ? status.split(',') : null;
  const tickets = await ticketService.listTicketsInBranch(req.params.branchId, statusList);
  return successResponse(res, 'Branch tickets retrieved successfully', { tickets });
});

export const call = asyncHandler(async (req, res) => {
  const { counterId } = req.body;
  const staffId = req.user.id;

  if (!counterId) {
    // Attempt auto-resolve from staff assignment
    const counter = await prisma.counter.findFirst({ where: { staffId } });
    if (!counter) {
      return res.status(400).json({ success: false, message: 'No counter assigned to this staff member. Please provide a counterId.' });
    }
    const ticket = await ticketService.callTicket(req.params.id, counter.id, staffId);
    return successResponse(res, 'Ticket called to counter', { ticket });
  }

  const ticket = await ticketService.callTicket(req.params.id, counterId, staffId);
  return successResponse(res, 'Ticket called to counter', { ticket });
});

export const serve = asyncHandler(async (req, res) => {
  const ticket = await ticketService.serveTicket(req.params.id);
  return successResponse(res, 'Ticket marked as currently serving', { ticket });
});

export const complete = asyncHandler(async (req, res) => {
  const ticket = await ticketService.completeTicket(req.params.id);
  return successResponse(res, 'Ticket marked as completed', { ticket });
});

export const skip = asyncHandler(async (req, res) => {
  const ticket = await ticketService.skipTicket(req.params.id);
  return successResponse(res, 'Ticket marked as skipped', { ticket });
});

export const cancel = asyncHandler(async (req, res) => {
  const ticket = await ticketService.cancelTicket(req.params.id, req.user.id);
  return successResponse(res, 'Ticket cancelled successfully', { ticket });
});

export const noShow = asyncHandler(async (req, res) => {
  const ticket = await ticketService.markNoShow(req.params.id);
  return successResponse(res, 'Ticket marked as no-show', { ticket });
});

export const transfer = asyncHandler(async (req, res) => {
  const ticket = await ticketService.transferTicket(req.params.id, req.body.targetCounterId);
  return successResponse(res, 'Ticket transferred successfully', { ticket });
});

export const getActiveTickets = asyncHandler(async (req, res) => {
  const tickets = await ticketService.getActiveTicketsForCustomer(req.user.id);
  return successResponse(res, 'Active tickets retrieved successfully', { tickets });
});

export const getHistoryTickets = asyncHandler(async (req, res) => {
  const { page = '1', limit = '20', status, date, search } = req.query;
  const result = await ticketService.getHistoryTicketsForCustomer(req.user.id, { page, limit, status, date, search });
  return successResponse(res, 'Ticket history retrieved successfully', result);
});

export const getBranchSummary = asyncHandler(async (req, res) => {
  const summary = await ticketService.getBranchQueueSummary(req.params.branchId);
  return successResponse(res, 'Branch queue summary retrieved', summary);
});

