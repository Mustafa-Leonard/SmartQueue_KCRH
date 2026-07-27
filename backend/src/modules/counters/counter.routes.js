import { Router } from 'express';
import * as counterController from './counter.controller.js';
import validate from '../../middleware/validate.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

// Public routes (no auth needed for display board)
router.get('/branch/:branchId', counterController.getBranchCounters);

// Protected routes
router.use(protect);

router.get('/', restrictTo('STAFF', 'ADMIN'), counterController.getCounters);

// Admin-only counters management
router.post('/', restrictTo('ADMIN'), validate(counterController.createCounterSchema), counterController.create);
router.put('/:id', restrictTo('ADMIN'), validate(counterController.updateCounterSchema), counterController.update);
router.delete('/:id', restrictTo('ADMIN'), counterController.remove);
router.put('/:id/assign-staff', restrictTo('ADMIN'), validate(counterController.assignStaffSchema), counterController.assignStaff);

// Staff & Admin access to toggle their status
router.put('/:id/status', restrictTo('ADMIN', 'STAFF'), validate(counterController.statusSchema), counterController.updateStatus);

export default router;
