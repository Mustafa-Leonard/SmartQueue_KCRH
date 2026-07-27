import * as appointmentService from './appointment.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { z } from 'zod';

export const createAppointmentSchema = z.object({
  serviceId: z.string().cuid('Provide a valid service ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Provide a valid date in YYYY-MM-DD format'),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, 'Provide a valid time slot in HH:MM format'),
  notes: z.string().optional()
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'])
});

export const getAppointments = asyncHandler(async (req, res) => {
  if (req.user.role === 'ADMIN' || req.user.role === 'STAFF') {
    const appointments = await appointmentService.listAllAppointments();
    return successResponse(res, 'All appointments retrieved', { appointments });
  }

  const appointments = await appointmentService.getCustomerAppointments(req.user.id);
  return successResponse(res, 'Customer appointments retrieved', { appointments });
});

export const create = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.bookAppointment(req.user.id, req.body);
  return successResponse(res, 'Appointment booked successfully', { appointment }, 201);
});

export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { serviceId, date } = req.query;
  if (!serviceId || !date) {
    return res.status(400).json({ success: false, message: 'serviceId and date query parameters are required' });
  }

  const slots = await appointmentService.getAvailableTimeSlots(serviceId, date);
  return successResponse(res, 'Available slots retrieved', { slots });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Customers can only cancel their own appointments
  if (req.user.role === 'CUSTOMER') {
    if (status !== 'CANCELLED') {
      return res.status(403).json({ success: false, message: 'Customers can only cancel appointments' });
    }
    const appointment = await appointmentService.getAppointmentById(id);
    if (!appointment || appointment.customerId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
  }

  const appointment = await appointmentService.updateAppointmentStatus(id, status);
  return successResponse(res, 'Appointment status updated successfully', { appointment });
});

export const reschedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, timeSlot } = req.body;

  // Verify ownership
  const appointment = await appointmentService.getAppointmentById(id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }
  if (req.user.role === 'CUSTOMER' && appointment.customerId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only reschedule your own appointments' });
  }

  const newAppointment = await appointmentService.rescheduleAppointment(id, { date, timeSlot });
  return successResponse(res, 'Appointment rescheduled successfully', { appointment: newAppointment });
});
