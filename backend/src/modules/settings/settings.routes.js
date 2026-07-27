import { Router } from 'express';
import * as settingsController from './settings.controller.js';
import validate from '../../middleware/validate.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/', settingsController.getAll);
router.post('/', validate(settingsController.upsertSchema), settingsController.upsert);
router.delete('/:key', settingsController.remove);

export default router;

