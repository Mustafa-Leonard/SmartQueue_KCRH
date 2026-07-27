import * as taskService from './task.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  branchId: z.string().cuid().optional(),
  assignedTo: z.string().cuid('Provide a valid staff ID').nullable().optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  dueDate: z.string().optional(),
  branchId: z.string().cuid().optional(),
  assignedTo: z.string().cuid().nullable().optional()
});

export const statusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
});

export const getAll = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo, branchId, search } = req.query;
  const tasks = await taskService.getAllTasks({ status, priority, assignedTo, branchId, search });
  return successResponse(res, 'Tasks retrieved successfully', { tasks });
});

export const getOne = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  return successResponse(res, 'Task retrieved successfully', { task });
});

export const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTasksForStaff(req.user.id);
  return successResponse(res, 'My tasks retrieved successfully', { tasks });
});

export const create = asyncHandler(async (req, res) => {
  const task = await taskService.createTask({
    ...req.body,
    assignedBy: req.user.id
  });
  return successResponse(res, 'Task created successfully', { task }, 201);
});

export const update = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.body);
  return successResponse(res, 'Task updated successfully', { task });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const task = await taskService.updateTaskStatus(req.params.id, req.body.status);
  return successResponse(res, 'Task status updated successfully', { task });
});

export const remove = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id);
  return successResponse(res, 'Task deleted successfully');
});

