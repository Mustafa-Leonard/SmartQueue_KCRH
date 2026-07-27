import { getIO, getDisplayNamespace } from '../config/socket.js';
import prisma from '../config/database.js';

// Rotating health tips for the display board
const HEALTH_TIPS = [
  'Wash your hands regularly with soap and clean water — Osha mikono yako mara kwa mara kwa sabuni na maji safi.',
  'Maintain at least 1 meter distance from others — Weka umbali wa angalau mita 1 kutoka kwa wengine.',
  'Cover your mouth and nose when coughing or sneezing — Funika mdomo wako unapokohoa au kupiga chafya.',
  'Drink at least 8 glasses of water per day — Kunywa angalau glasi 8 za maji kwa siku.',
  'Get vaccinated to protect yourself and others — Pata chanjo ili kujilinda wewe na wengine.',
  'Eat a balanced diet with fruits and vegetables — Kula mlo kamili wenye matunda na mboga.',
  'Exercise for at least 30 minutes daily — Fanya mazoezi kwa angalau dakika 30 kila siku.',
  'Visit the hospital for regular check-ups — Tembelea hospitali kwa ukaguzi wa mara kwa mara.',
  'Take all medications as prescribed by your doctor — Kwa dawa zote kama alivyoagiza daktari wako.',
  'Rest when you feel unwell — Pumzika unapojisikia mgonjwa.',
];

export const getRandomHealthTip = () => {
  return HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];
};

export const emitTicketCalled = (branchId, ticketNumber, counterName, serviceName) => {
  try {
    const io = getIO();
    const payload = { ticketNumber, counterName, serviceName, branchId };
    
    // Broadcast to branch room
    io.to(`branch:${branchId}`).emit('ticket:called', payload);
    console.info(`[Socket Broadcast] ticket:called in branch:${branchId} ->`, payload);
  } catch (err) {
    console.error('Socket emit failed:', err.message);
  }
};

export const emitQueueUpdated = async (branchId) => {
  try {
    const io = getIO();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's queue
    const queue = await prisma.queue.findFirst({
      where: { branchId, date: today }
    });

    if (!queue) {
      return;
    }

    // Get waiting tickets to find size
    const waitingTickets = await prisma.ticket.findMany({
      where: { queueId: queue.id, status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
      select: { ticketCode: true }
    });

    const totalWaiting = waitingTickets.length;

    // Send queue updates to everyone in the branch
    io.to(`branch:${branchId}`).emit('queue:updated', {
      branchId,
      waitingCount: totalWaiting
    });

    // Send positional updates to each individual ticket channel
    waitingTickets.forEach((ticket, idx) => {
      const position = idx + 1;
      io.to(`ticket:${ticket.ticketCode}`).emit('ticket:position_update', {
        position,
        waitingCount: totalWaiting
      });
    });

    console.info(`[Socket Broadcast] queue:updated in branch:${branchId} | Waiting: ${totalWaiting}`);
  } catch (err) {
    console.error('Socket queue updated emit failed:', err.message);
  }
};

export const emitDisplayRefresh = async (branchId) => {
  try {
    const io = getIO();
    const displayNs = getDisplayNamespace();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all tickets serving and waiting in this branch today
    const queue = await prisma.queue.findFirst({
      where: { branchId, date: today }
    });

    let waitingCount = 0;
    let servingTickets = [];
    let waitingTickets = [];

    if (queue) {
      servingTickets = await prisma.ticket.findMany({
        where: {
          queueId: queue.id,
          status: { in: ['CALLED', 'SERVING'] },
          calledAt: { not: null }
        },
        orderBy: { calledAt: 'desc' },
        select: {
          ticketNumber: true,
          counter: { select: { name: true, number: true } },
          service: { select: { name: true } }
        }
      });

      waitingTickets = await prisma.ticket.findMany({
        where: {
          queueId: queue.id,
          status: 'WAITING'
        },
        orderBy: { createdAt: 'asc' },
        take: 8,
        select: {
          ticketNumber: true,
          service: { select: { name: true } }
        }
      });

      waitingCount = await prisma.ticket.count({
        where: { queueId: queue.id, status: 'WAITING' }
      });
    }

    const payload = {
      branchId,
      serving: servingTickets.map(t => ({
        number: t.ticketNumber,
        counter: t.counter?.name || `Counter ${t.counter?.number || ''}`,
        service: t.service.name
      })),
      waiting: waitingTickets.map((t, i) => ({
        number: t.ticketNumber,
        service: t.service.name,
        position: i + 1
      })),
      waitingCount,
      healthTip: getRandomHealthTip(),
      timestamp: new Date().toISOString()
    };

    // Emit to authenticated branch room
    io.to(`branch:${branchId}`).emit('display:refresh', payload);

    // Emit to public display namespace room
    displayNs.to(`display:${branchId}`).emit('display:refresh', payload);
    displayNs.to(`display:${branchId}`).emit('ticket:called', payload.serving[0] || null);

    console.info(`[Socket Broadcast] display:refresh in branch:${branchId} | Serving: ${payload.serving.length}, Waiting: ${payload.waiting.length}`);
  } catch (err) {
    console.error('Socket display refresh emit failed:', err.message);
  }
};
