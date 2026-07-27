import { Router } from 'express';
import * as userController from './user.controller.js';
import validate from '../../middleware/validate.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

// All user management routes require authentication
router.use(protect);

// ─── Staff List — must come BEFORE /:id to avoid route conflict ───────────────
router.get(
  '/staff/list',
  restrictTo('ADMIN'),
  userController.getStaff
);

// ─── CRUD Routes (Admin only) ─────────────────────────────────────────────────
router.get('/', restrictTo('ADMIN'), userController.getAll);

router.get('/:id', restrictTo('ADMIN'), userController.getOne);

router.post(
  '/',
  restrictTo('ADMIN'),
  validate(userController.createUserSchema),
  userController.create
);

router.put(
  '/:id',
  restrictTo('ADMIN'),
  validate(userController.updateUserSchema),
  userController.update
);

router.patch(
  '/:id/toggle-active',
  restrictTo('ADMIN'),
  userController.toggleActive
);

router.put(
  '/:id/role',
  restrictTo('ADMIN'),
  validate(userController.changeRoleSchema),
  userController.changeRole
);

router.delete('/:id', restrictTo('ADMIN'), userController.remove);

export default router;
