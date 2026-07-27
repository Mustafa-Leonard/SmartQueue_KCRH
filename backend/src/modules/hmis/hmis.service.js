import prisma from '../../config/database.js';
import { createAuditLog } from '../audit/audit.service.js';

/**
 * HMIS Patient Lookup - Search by various identifiers
 * This is the integration point for the hospital's HMIS/MAT system
 */
export const lookupPatient = async ({ hospitalNumber, mrn, nationalId, shaNumber, phone }) => {
  const where = {};
  
  if (hospitalNumber) where.hospitalNumber = hospitalNumber;
  if (mrn) where.mrn = mrn;
  if (nationalId) where.nationalId = nationalId;
  if (shaNumber) where.shaNumber = shaNumber;
  if (phone) where.phone = phone;

  // First check if we have the patient in our local DB
  const localPatient = await prisma.user.findFirst({
    where: {
      ...where,
      role: 'PATIENT'
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true
    }
  });

  if (localPatient) {
    await logIntegration('INBOUND', 'HMIS', 'lookup', { identifier: { hospitalNumber, mrn, nationalId, shaNumber } }, { found: true, local: true });
    return { source: 'local', patient: localPatient };
  }

  // If not found locally, attempt to query HMIS/MAT system
  // This is a placeholder - in production, make actual HTTP call to HMIS API
  // const hmisPatient = await fetchFromHMIS({ hospitalNumber, mrn, nationalId, shaNumber });
  // if (hmisPatient) { ... }

  await logIntegration('INBOUND', 'HMIS', 'lookup', { identifier: { hospitalNumber, mrn, nationalId, shaNumber } }, { found: false });
  return { source: 'hmis', patient: null };
};

/**
 * Sync appointment from HMIS/MAT to SmartQueue
 */
export const syncAppointment = async (appointmentData) => {
  const { externalId, patientId, serviceId, date, timeSlot, notes } = appointmentData;

  // Check if already synced
  const existing = await prisma.appointment.findFirst({
    where: { notes: { contains: `hmis_id:${externalId}` } }
  });

  if (existing) {
    // Update existing
    return prisma.appointment.update({
      where: { id: existing.id },
      data: { date: new Date(date), timeSlot, notes: notes || existing.notes }
    });
  }

  // Create new appointment
  const appointment = await prisma.appointment.create({
    data: {
      customerId: patientId,
      serviceId,
      date: new Date(date),
      timeSlot,
      notes: notes ? `${notes} | hmis_id:${externalId}` : `hmis_id:${externalId}`,
      status: 'CONFIRMED'
    }
  });

  await logIntegration('INBOUND', 'HMIS', 'sync_appointment', appointmentData, { created: true, id: appointment.id });

  return appointment;
};

/**
 * Push completed visit to HMIS/MAT system
 */
export const pushCompletedVisit = async (ticketId) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      service: { select: { name: true, estimatedTime: true } },
      counter: { select: { name: true, number: true } },
      queue: { include: { branch: { select: { id: true, name: true } } } }
    }
  });

  if (!ticket || ticket.status !== 'COMPLETED') {
    throw new Error('Ticket must be completed before pushing to HMIS');
  }

  const visitData = {
    patientId: ticket.customer.id,
    patientName: ticket.customer.name,
    patientPhone: ticket.customer.phone,
    serviceName: ticket.service.name,
    departmentName: ticket.queue.branch.name,
    counterName: ticket.counter?.name,
    ticketNumber: ticket.ticketNumber,
    type: ticket.type,
    registeredAt: ticket.createdAt,
    calledAt: ticket.calledAt,
    servedAt: ticket.servedAt,
    completedAt: ticket.completedAt,
    waitDuration: ticket.calledAt ? Math.round((new Date(ticket.calledAt) - new Date(ticket.createdAt)) / 60000) : null,
    serviceDuration: ticket.servedAt && ticket.completedAt ? Math.round((new Date(ticket.completedAt) - new Date(ticket.servedAt)) / 60000) : null
  };

  // In production, send this data to HMIS/MAT via HTTP POST
  // const response = await fetch('https://hmis.kilifi.go.ke/api/visits', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${HMIS_API_KEY}` },
  //   body: JSON.stringify(visitData)
  // });

  await logIntegration('OUTBOUND', 'HMIS', 'push_visit', visitData, { pushed: true });

  return visitData;
};

/**
 * Sync departments from HMIS/MAT
 */
export const syncDepartments = async (departments) => {
  const results = [];
  for (const dept of departments) {
    const existing = await prisma.branch.findFirst({
      where: { name: dept.name }
    });

    if (existing) {
      const updated = await prisma.branch.update({
        where: { id: existing.id },
        data: { description: dept.description, location: dept.location, isActive: dept.isActive }
      });
      results.push(updated);
    } else {
      const created = await prisma.branch.create({
        data: { name: dept.name, description: dept.description, location: dept.location, isActive: dept.isActive ?? true }
      });
      results.push(created);
    }
  }

  await logIntegration('INBOUND', 'HMIS', 'sync_departments', { count: departments.length }, { synced: results.length });

  return results;
};

/**
 * Log integration request/response for audit trail
 */
async function logIntegration(direction, system, endpoint, request, response) {
  try {
    await prisma.integrationLog.create({
      data: {
        direction,
        system,
        endpoint,
        request: JSON.stringify(request),
        response: JSON.stringify(response),
        statusCode: response?.error ? 500 : 200,
        status: response?.error ? 'FAILED' : 'SUCCESS',
        errorMessage: response?.error
      }
    });
  } catch (err) {
    console.error('Failed to log integration:', err.message);
  }
}

/**
 * Get integration logs
 */
export const getIntegrationLogs = async ({ system, status, page = 1, limit = 50 }) => {
  const where = {};
  if (system) where.system = system;
  if (status) where.status = status;

  const [logs, total] = await Promise.all([
    prisma.integrationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.integrationLog.count({ where })
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
};
