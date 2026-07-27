import prisma from '../config/database.js';

export const generateTicketNumber = async (serviceId) => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { name: true }
  });

  if (!service) {
    throw new Error('Service not found when generating ticket number');
  }

  // Get service prefix (3 capital letters)
  const servicePrefix = service.name
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Count tickets created for this service today to establish sequence
  const ticketCountToday = await prisma.ticket.count({
    where: {
      serviceId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  const nextSequenceNumber = ticketCountToday + 1;
  const paddedSequence = String(nextSequenceNumber).padStart(3, '0');

  // Format: OPD001, PHR023, LAB124
  return `${servicePrefix}${paddedSequence}`;
};
