import { Router } from 'express';
import * as ticketController from './ticket.controller.js';
import validate from '../../middleware/validate.js';
import { protect, restrictTo } from '../../middleware/auth.js';

const router = Router();

// Public tracking (no auth needed)
router.get('/track/:ticketCode', ticketController.track);

// Public branch queue summary (no auth needed - used on join queue page)
router.get('/branch/:branchId/summary', ticketController.getBranchSummary);

// Protected routes
router.use(protect);

router.get('/my-active', restrictTo('CUSTOMER'), ticketController.getActiveTickets);
router.get('/my-history', restrictTo('CUSTOMER'), ticketController.getHistoryTickets);

router.post('/join', restrictTo('CUSTOMER', 'ADMIN'), validate(ticketController.joinQueueSchema), ticketController.join);
router.post('/:id/cancel', restrictTo('CUSTOMER'), ticketController.cancel);
router.get('/branch/:branchId', restrictTo('STAFF', 'ADMIN'), ticketController.getBranchTickets);

// Counter operations
router.post('/:id/call', restrictTo('STAFF'), ticketController.call);
router.post('/:id/serve', restrictTo('STAFF'), ticketController.serve);
router.post('/:id/complete', restrictTo('STAFF'), ticketController.complete);
router.post('/:id/skip', restrictTo('STAFF'), ticketController.skip);
router.post('/:id/no-show', restrictTo('STAFF'), ticketController.noShow);
router.post('/:id/transfer', restrictTo('STAFF'), validate(ticketController.transferSchema), ticketController.transfer);

export default router;
