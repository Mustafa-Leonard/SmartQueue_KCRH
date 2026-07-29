import * as authService from './auth.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Provide a valid email address'),
  phone: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, 'Provide a valid phone number in international format (e.g. +254712345678)'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().trim().email('Provide a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const register = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection?.remoteAddress;
  const result = await authService.registerUser({ ...req.body, ipAddress });
  return successResponse(res, 'User registered successfully', result, 201);
});

export const login = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection?.remoteAddress;
  const result = await authService.loginUser({ ...req.body, ipAddress });
  return successResponse(res, 'Login successful', result);
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return errorResponse(res, 'Refresh token is required', [], 400);
  }

  const ipAddress = req.ip || req.connection?.remoteAddress;
  const tokens = await authService.refreshTokens({ refreshToken, ipAddress });
  return successResponse(res, 'Tokens refreshed successfully', tokens);
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user.id);
  return successResponse(res, 'User profile retrieved successfully', { user });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];
  await authService.logoutUser(req.user.id, refreshToken);
  return successResponse(res, 'Logout successful');
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().trim().email('Provide a valid email address').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Provide a valid phone number').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  notificationPrefs: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyContactName: z.string().optional(),
  profileImageUrl: z.string().optional(),
  // Patient medical fields
  weight: z.string().optional(),
  bloodType: z.string().optional(),
  height: z.string().optional(),
  lastVisit: z.string().optional(),
  diseases: z.string().optional(),
  allergies: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional()
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await authService.updateUserProfile(req.user.id, req.body);
  return successResponse(res, 'Profile updated successfully', { user: updatedUser });
});

// Password Reset Schemas
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Provide a valid email address')
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Provide a valid email address'),
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.initiatePasswordReset(req.body.email);
  return successResponse(res, result.message, {});
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.completePasswordReset(req.body);
  return successResponse(res, result.message, {});
});
