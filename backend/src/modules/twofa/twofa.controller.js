import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import * as twofaService from './twofa.service.js';

/**
 * GET /api/auth/2fa/setup
 * Generate and return 2FA secret + provisioning URI
 */
export const setup2FA = async (req, res, next) => {
  try {
    const result = await twofaService.enable2FA(req.user.id);
    successResponse(res, '2FA setup initialized', result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/2fa/verify
 * Verify the initial 2FA token and activate 2FA
 */
export const verifyAndActivate2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return errorResponse(res, 'Verification code is required', [], 400);
    }
    const result = await twofaService.verifyAndActivate2FA(req.user.id, token);
    successResponse(res, '2FA activated successfully', result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for the authenticated user
 */
export const disable2FA = async (req, res, next) => {
  try {
    const result = await twofaService.disable2FA(req.user.id);
    successResponse(res, '2FA disabled successfully', result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/2fa/verify-login
 * Verify 2FA code during login (before issuing tokens)
 */
export const verifyLogin2FA = async (req, res, next) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      return errorResponse(res, 'User ID and verification code are required', [], 400);
    }
    const result = await twofaService.require2FA(userId, token);
    successResponse(res, '2FA verification result', result);
  } catch (err) {
    next(err);
  }
};

