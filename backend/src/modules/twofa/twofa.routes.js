import { Router } from 'express';
import { protect } from '../../middleware/auth.js';
import * as twofaController from './twofa.controller.js';

const router = Router();

// All 2FA routes require authentication
router.get('/setup', protect, twofaController.setup2FA);
router.post('/verify', protect, twofaController.verifyAndActivate2FA);
router.post('/disable', protect, twofaController.disable2FA);
router.post('/verify-login', twofaController.verifyLogin2FA);

export default router;

