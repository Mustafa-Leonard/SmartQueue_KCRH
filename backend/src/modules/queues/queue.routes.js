import { Router } from 'express';
import * as queueController from './queue.controller.js';
import validate from '../../middleware/validate.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

router.get('/today/:branchId', queueController.getTodayBranchQueue);

// Protected queue management routes
router.post('/open', protect, restrictTo('ADMIN', 'STAFF'), validate(queueController.openQueueSchema), queueController.open);
router.put('/:id/close', protect, restrictTo('ADMIN'), queueController.close);

export default router;
