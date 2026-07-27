import { Router } from 'express';
import * as hmisController from './hmis.controller.js';
import validate from '../../middleware/validate.js';
import { protect, restrictTo } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// HMIS integration uses API key auth (not JWT)
// In production, validate HMIS API key from header
router.post('/lookup', authLimiter, validate(hmisController.lookupSchema), hmisController.lookup);
router.post('/sync-appointment', authLimiter, validate(hmisController.syncAppointmentSchema), hmisController.syncAppointment);
router.post('/push-visit', authLimiter, hmisController.pushVisit);
router.post('/sync-departments', authLimiter, validate(hmisController.syncDepartmentsSchema), hmisController.syncDepartments);

// Protected routes for viewing integration logs
router.get('/logs', protect, restrictTo('ADMIN'), hmisController.getLogs);

export default router;
