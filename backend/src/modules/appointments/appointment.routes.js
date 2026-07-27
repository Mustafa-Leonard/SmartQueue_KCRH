import { Router } from 'express';
import * as appointmentController from './appointment.controller.js';
import validate from '../../middleware/validate.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', appointmentController.getAppointments);
router.get('/available-slots', appointmentController.getAvailableSlots); // Needs serviceId and date query parameters
router.post('/', restrictTo('CUSTOMER', 'ADMIN'), validate(appointmentController.createAppointmentSchema), appointmentController.create);
router.put('/:id/status', protect, validate(appointmentController.updateStatusSchema), appointmentController.changeStatus);
router.put('/:id/reschedule', protect, appointmentController.reschedule);

export default router;
