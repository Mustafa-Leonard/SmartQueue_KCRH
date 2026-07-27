import prisma from '../../config/database.js';

export const getOverviewKPIs = async (branchId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filter = {};
  if (branchId) {
    filter.queue = { branchId };
  }

  // Count tickets created today grouped by status
  const ticketsToday = await prisma.ticket.findMany({
    where: {
      createdAt: { gte: today },
      ...filter
    },
    select: { status: true, calledAt: true, servedAt: true, completedAt: true }
  });

  const total = ticketsToday.length;
  const waiting = ticketsToday.filter(t => t.status === 'WAITING').length;
  const serving = ticketsToday.filter(t => t.status === 'SERVING' || t.status === 'CALLED').length;
  const completed = ticketsToday.filter(t => t.status === 'COMPLETED').length;

  // Calculate Average Wait Time
  const completedTickets = ticketsToday.filter(t => t.status === 'COMPLETED' && t.calledAt);
  let totalWaitTime = 0;
  completedTickets.forEach(t => {
    const wait = new Date(t.calledAt) - new Date(t.createdAt);
    totalWaitTime += wait;
  });

  const avgWaitMinutes = completedTickets.length > 0 
    ? Math.round((totalWaitTime / completedTickets.length) / 60000) 
    : 0;

  // Counters status count
  const counterFilter = branchId ? { branchId } : {};
  const activeCounters = await prisma.counter.count({
    where: {
      status: 'OPEN',
      ...counterFilter
    }
  });

  const totalCounters = await prisma.counter.count({
    where: counterFilter
  });

  return {
    ticketsToday: total,
    waiting,
    serving,
    completed,
    avgWaitMinutes,
    openCounters: activeCounters,
    totalCounters
  };
};

export const getTicketsTodayBreakdown = async (branchId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filter = branchId ? { queue: { branchId } } : {};

  // Group tickets today by hour
  const tickets = await prisma.ticket.findMany({
    where: {
      createdAt: { gte: today },
      ...filter
    },
    select: { createdAt: true }
  });

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    tickets: 0
  }));

  tickets.forEach(t => {
    const hr = new Date(t.createdAt).getHours();
    hourlyData[hr].tickets += 1;
  });

  return hourlyData;
};

export const getWaitTimeTrends = async (branchId, days = 7) => {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);
  sinceDate.setHours(0, 0, 0, 0);

  const filter = branchId ? { queue: { branchId } } : {};

  const completedTickets = await prisma.ticket.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { gte: sinceDate },
      calledAt: { not: null },
      ...filter
    },
    select: { createdAt: true, calledAt: true }
  });

  // Aggregate average wait minutes grouped by Date string
  const dateGroups = {};
  completedTickets.forEach(t => {
    const dateStr = new Date(t.createdAt).toISOString().split('T')[0];
    const waitMs = new Date(t.calledAt) - new Date(t.createdAt);
    const waitMin = waitMs / 60000;

    if (!dateGroups[dateStr]) {
      dateGroups[dateStr] = { total: 0, count: 0 };
    }
    dateGroups[dateStr].total += waitMin;
    dateGroups[dateStr].count += 1;
  });

  const result = Object.keys(dateGroups).map(date => ({
    date,
    avgWaitMinutes: Math.round(dateGroups[date].total / dateGroups[date].count)
  })).sort((a, b) => a.date.localeCompare(b.date));

  return result;
};

/**
 * Get service distribution for today (count of tickets per service).
 * Used by AnalyticsPage pie chart.
 */
export const getServiceDistribution = async (branchId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filter = { createdAt: { gte: today } };
  if (branchId) {
    filter.queue = { branchId };
  }

  const tickets = await prisma.ticket.findMany({
    where: filter,
    select: {
      service: { select: { name: true } }
    }
  });

  const distributionMap = {};
  tickets.forEach(t => {
    const name = t.service?.name || 'Unknown';
    if (!distributionMap[name]) {
      distributionMap[name] = 0;
    }
    distributionMap[name]++;
  });

  return Object.keys(distributionMap).map(name => ({
    name,
    count: distributionMap[name]
  }));
};

export const getCounterPerformance = async (branchId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filter = branchId ? { branchId } : {};

  const counters = await prisma.counter.findMany({
    where: filter,
    include: {
      staff: { select: { name: true } },
      tickets: {
        where: { createdAt: { gte: today } },
        select: { status: true, calledAt: true, completedAt: true }
      }
    }
  });

  const performance = counters.map(c => {
    const tickets = c.tickets;
    const completed = tickets.filter(t => t.status === 'COMPLETED');
    const skipped = tickets.filter(t => t.status === 'SKIPPED').length;
    const noShow = tickets.filter(t => t.status === 'NO_SHOW').length;

    let totalServiceTime = 0;
    completed.forEach(t => {
      if (t.completedAt && t.calledAt) {
        totalServiceTime += (new Date(t.completedAt) - new Date(t.calledAt));
      }
    });

    const avgServiceTimeMin = completed.length > 0
      ? Math.round((totalServiceTime / completed.length) / 60000)
      : 0;

    return {
      counterId: c.id,
      counterName: c.name,
      counterNumber: c.number,
      staffName: c.staff?.name || 'Unassigned',
      totalServed: tickets.length,
      completedCount: completed.length,
      skippedCount: skipped,
      noShowCount: noShow,
      avgServiceTimeMinutes: avgServiceTimeMin
    };
  });

  return performance;
};
