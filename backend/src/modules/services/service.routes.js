import { Router } from 'express';
import * as serviceController from './service.controller.js';
import validate from '../../middleware/validate.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

// ─── Public / Authenticated read routes ──────────────────────────────────────
// Note: /branch/:branchId must come before /:id to avoid param conflict
router.get('/branch/:branchId', serviceController.getBranchServices);

router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getService);

// ─── Admin-only mutation routes ───────────────────────────────────────────────
router.post(
  '/',
  protect,
  restrictTo('ADMIN'),
  validate(serviceController.createServiceSchema),
  serviceController.create
);

router.put(
  '/:id',
  protect,
  restrictTo('ADMIN'),
  validate(serviceController.updateServiceSchema),
  serviceController.update
);

router.patch(
  '/:id',
  protect,
  restrictTo('ADMIN'),
  validate(serviceController.updateServiceSchema),
  serviceController.update
);

router.delete('/:id', protect, restrictTo('ADMIN'), serviceController.remove);

export default router;
