import prisma from '../../config/database.js';

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, phone: true } },
  creator: { select: { id: true, name: true, email: true } },
  branch: { select: { id: true, name: true } }
};

export const getAllTasks = async ({ status, priority, assignedTo, branchId, search } = {}) => {
  const where = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedTo) where.assignedTo = assignedTo;
  if (branchId) where.branchId = branchId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  return prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [
      { priority: 'asc' },
      { createdAt: 'desc' }
    ]
  });
};

export const getTaskById = async (id) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: taskInclude
  });

  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  return task;
};

export const getTasksForStaff = async (staffId) => {
  return prisma.task.findMany({
    where: { assignedTo: staffId },
    include: {
      ...taskInclude,
      creator: { select: { id: true, name: true } }
    },
    orderBy: [
      { status: 'asc' },
      { priority: 'asc' },
      { createdAt: 'desc' }
    ]
  });
};

export const createTask = async ({ title, description, priority, dueDate, branchId, assignedTo, assignedBy }) => {
  return prisma.task.create({
    data: {
      title,
      description,
      priority: priority || 'MEDIUM',
      dueDate: dueDate ? new Date(dueDate) : null,
      branchId,
      assignedTo,
      assignedBy
    },
    include: taskInclude
  });
};

export const updateTask = async (id, data) => {
  await getTaskById(id);

  const updateData = { ...data };
  if (updateData.dueDate) {
    updateData.dueDate = new Date(updateData.dueDate);
  }

  Object.keys(updateData).forEach(
    (k) => updateData[k] === undefined && delete updateData[k]
  );

  return prisma.task.update({
    where: { id },
    data: updateData,
    include: taskInclude
  });
};

export const deleteTask = async (id) => {
  await getTaskById(id);
  return prisma.task.delete({ where: { id } });
};

export const updateTaskStatus = async (id, status) => {
  await getTaskById(id);
  return prisma.task.update({
    where: { id },
    data: { status },
    include: taskInclude
  });
};

