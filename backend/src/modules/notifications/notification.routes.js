import { Router } from 'express';
import { getNotificationsLog, markAsRead, markAllAsRead } from './notification.controller.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

router.use(protect);

// Admin sees all, STAFF/CUSTOMER see their own based on userId
router.get('/', getNotificationsLog);
router.patch('/:id/read', markAsRead);
router.post('/read-all', restrictTo('ADMIN', 'CUSTOMER', 'STAFF'), markAllAsRead);

export default router;
