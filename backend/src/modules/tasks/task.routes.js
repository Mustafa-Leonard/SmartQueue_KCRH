import { Router } from 'express';
import * as taskController from './task.controller.js';
import validate from '../../middleware/validate.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

router.use(protect);

// Staff can view their own tasks
router.get('/my', restrictTo('STAFF', 'ADMIN'), taskController.getMyTasks);

// Admin-only management
router.get('/', restrictTo('ADMIN'), taskController.getAll);
router.get('/:id', restrictTo('ADMIN', 'STAFF'), taskController.getOne);
router.post('/', restrictTo('ADMIN'), validate(taskController.createTaskSchema), taskController.create);
router.put('/:id', restrictTo('ADMIN'), validate(taskController.updateTaskSchema), taskController.update);
router.patch('/:id/status', restrictTo('STAFF', 'ADMIN'), validate(taskController.statusSchema), taskController.updateStatus);
router.delete('/:id', restrictTo('ADMIN'), taskController.remove);

export default router;

