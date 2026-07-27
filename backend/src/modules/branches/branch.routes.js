import { Router } from 'express';
import * as branchController from './branch.controller.js';
import validate from '../../middleware/validate.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────
// Anyone (even unauthenticated) can view branch lists (non-admins get active only)
router.get('/', branchController.getBranches);
router.get('/:id', branchController.getBranch);
router.get('/:id/stats', branchController.getBranchStats);

// ─── Admin-only routes ────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  restrictTo('ADMIN'),
  validate(branchController.createBranchSchema),
  branchController.create
);

router.put(
  '/:id',
  protect,
  restrictTo('ADMIN'),
  validate(branchController.updateBranchSchema),
  branchController.update
);

router.patch(
  '/:id',
  protect,
  restrictTo('ADMIN'),
  validate(branchController.updateBranchSchema),
  branchController.patch
);

router.delete('/:id', protect, restrictTo('ADMIN'), branchController.remove);

export default router;
