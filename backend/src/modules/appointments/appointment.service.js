import prisma from '../../config/database.js';
import { sendAppointmentConfirmedMessage } from '../notifications/notification.service.js';

export const bookAppointment = async (customerId, { serviceId, date, timeSlot, notes }) => {
  const parsedDate = new Date(date);
  parsedDate.setHours(0, 0, 0, 0);

  // 1. Verify slot is available
  const existing = await prisma.appointment.findFirst({
    where: {
      serviceId,
      date: parsedDate,
      timeSlot,
      status: { in: ['PENDING', 'CONFIRMED'] }
    }
  });

  if (existing) {
    throw new Error('This time slot is already booked for the selected service.');
  }

  // 2. Create booking
  const appointment = await prisma.appointment.create({
    data: {
      date: parsedDate,
      timeSlot,
      notes,
      customerId,
      serviceId
    },
    include: {
      customer: true,
      service: true
    }
  });

  // Welcome / pending notification
  // Confirmation is done manually by STAFF or automated rules. For this deployment, we auto-confirm walk-in bookings to show notifications immediately.
  const confirmed = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: 'CONFIRMED' },
    include: { customer: true, service: true }
  });

  sendAppointmentConfirmedMessage(confirmed.customer, confirmed, confirmed.service.name)
    .catch(err => console.error('Appointment confirmation notification failed:', err.message));

  return confirmed;
};

export const getCustomerAppointments = async (customerId) => {
  return prisma.appointment.findMany({
    where: { customerId },
    include: {
      service: {
        select: {
          name: true,
          branch: { select: { name: true } }
        }
      }
    },
    orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }]
  });
};

export const getAvailableTimeSlots = async (serviceId, dateStr) => {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  // Default hospital hours: 09:00 to 16:00 in 30 minute blocks
  const defaultSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00'
  ];

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      serviceId,
      date,
      status: { in: ['PENDING', 'CONFIRMED'] }
    },
    select: { timeSlot: true }
  });

  const bookedSlots = bookedAppointments.map(a => a.timeSlot);

  // Return slots that are NOT booked
  return defaultSlots.filter(slot => !bookedSlots.includes(slot));
};

export const listAllAppointments = async () => {
  return prisma.appointment.findMany({
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      service: {
        select: {
          name: true,
          branch: { select: { name: true } }
        }
      }
    },
    orderBy: [{ date: 'desc' }, { timeSlot: 'asc' }]
  });
};

export const getAppointmentById = async (id) => {
  return prisma.appointment.findUnique({ where: { id } });
};

export const updateAppointmentStatus = async (id, status) => {
  return prisma.appointment.update({
    where: { id },
    data: { status }
  });
};

/**
 * Reschedule an appointment to a new date/time slot.
 * Updates the existing appointment with new date/timeSlot and sets status to RESCHEDULED,
 * then creates a new pending appointment with the new slot.
 */
export const rescheduleAppointment = async (appointmentId, { date, timeSlot }) => {
  // Fetch the existing appointment
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  });

  if (!existing) {
    const err = new Error('Appointment not found');
    err.statusCode = 404;
    throw err;
  }

  // Check if new slot is available
  const parsedDate = new Date(date);
  parsedDate.setHours(0, 0, 0, 0);

  const conflicting = await prisma.appointment.findFirst({
    where: {
      serviceId: existing.serviceId,
      date: parsedDate,
      timeSlot,
      status: { in: ['PENDING', 'CONFIRMED'] },
      id: { not: appointmentId }
    }
  });

  if (conflicting) {
    throw new Error('The new time slot is already booked');
  }

  // Mark old appointment as RESCHEDULED with new date info stored
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'RESCHEDULED' }
  });

  // Create new appointment with the new slot details
  const newAppointment = await prisma.appointment.create({
    data: {
      date: parsedDate,
      timeSlot,
      status: 'PENDING',
      customerId: existing.customerId,
      serviceId: existing.serviceId,
      notes: existing.notes
    },
    include: {
      customer: true,
      service: true
    }
  });

  return newAppointment;
};
