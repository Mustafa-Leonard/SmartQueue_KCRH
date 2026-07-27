import { Router } from 'express';
import * as feedbackController from './feedback.controller.js';
import validate from '../../middleware/validate.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

router.use(protect);

// Customer routes
router.post('/', restrictTo('CUSTOMER'), validate(feedbackController.createFeedbackSchema), feedbackController.create);
router.get('/my', restrictTo('CUSTOMER'), feedbackController.getMy);

// Admin routes
router.get('/', restrictTo('ADMIN'), feedbackController.getAll);
router.get('/stats', restrictTo('ADMIN'), feedbackController.getStats);
router.patch('/:id/read', restrictTo('ADMIN'), feedbackController.markRead);

export default router;

