import { Router } from 'express';
import * as authController from './auth.controller.js';
import validate from '../../middleware/validate.js';
import { protect } from '../../middleware/auth.js';
import { authLimiter, loginLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, validate(authController.registerSchema), authController.register);
router.post('/login', loginLimiter, validate(authController.loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/profile', protect, validate(authController.updateProfileSchema), authController.updateProfile);

// Password Reset (rate-limited)
router.post('/forgot-password', authLimiter, validate(authController.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(authController.resetPasswordSchema), authController.resetPassword);

export default router;
