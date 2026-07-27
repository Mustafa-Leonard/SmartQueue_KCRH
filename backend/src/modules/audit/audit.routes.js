import { Router } from 'express';
import * as auditController from './audit.controller.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/activity', auditController.getActivityLogs);
router.get('/logs', auditController.getAuditLogs);
router.get('/audit', auditController.getAuditLogs);

export default router;
