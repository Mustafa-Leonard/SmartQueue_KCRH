import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../config/database.js';
import { generateTokens, verifyRefreshToken } from '../../utils/jwt.js';
import { sendEmail, sendWelcomeMessage } from '../notifications/notification.service.js';
import config from '../../config/env.js';
import { createActivityLog } from '../audit/audit.service.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;
const PASSWORD_MIN_LENGTH = 8;

const authError = (message, status) => Object.assign(new Error(message), { status });

/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  return errors;
}

/**
 * Register a new user with enterprise-grade security
 */
export const registerUser = async ({ name, email, phone, password, ipAddress }) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  const normalizedPhone = phone ? phone.trim() : '';

  // Validate required fields
  if (!name || !password) {
    throw authError('Name and password are required', 400);
  }

  // Password strength validation
  const passwordErrors = validatePasswordStrength(password);
  if (passwordErrors.length > 0) {
    throw authError(passwordErrors.join('; '), 400);
  }

  // Check both unique fields in one query; database constraints handle concurrent registrations.
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { phone: normalizedPhone }] },
    select: { email: true, phone: true }
  });
  if (existingUser?.email === normalizedEmail) {
    throw authError('Email is already registered', 409);
  }
  if (existingUser?.phone === normalizedPhone) {
    throw authError('Phone number is already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const { user, tokens } = await prisma.$transaction(async (transaction) => {
    const createdUser = await transaction.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password: hashedPassword,
        role: 'CUSTOMER',
        notificationPrefs: JSON.stringify({ sms: true, email: false, whatsapp: false, inApp: true }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    const createdTokens = generateTokens({ id: createdUser.id, role: createdUser.role });
    await createSession(createdUser.id, createdTokens.refreshToken, ipAddress, transaction);
    return { user: createdUser, tokens: createdTokens };
  });

  // Log activity
  await createActivityLog({
    userId: user.id,
    type: 'REGISTRATION',
    message: `User ${user.name} registered successfully`,
    ipAddress
  });

  // Welcome message (fire and forget)
  sendWelcomeMessage(user).catch(err => console.error('Welcome SMS failed:', err.message));

  return { user, ...tokens };
};

/**
 * Login with account locking protection
 */
export const loginUser = async ({ email, password, ipAddress }) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    throw authError('Invalid email or password', 401);
  }

  // Admins use the IP-based login limiter instead of an account lock that can disable operations.
  if (user.role !== 'ADMIN' && user.isLocked && user.lockedUntil && new Date() < user.lockedUntil) {
    const remainingMinutes = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw authError(`Account is locked. Try again in ${remainingMinutes} minute(s) or contact support.`, 423);
  }

  // Reset lock if lock period expired
  if (user.role !== 'ADMIN' && user.isLocked && user.lockedUntil && new Date() >= user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isLocked: false, lockedUntil: null, failedLoginAttempts: 0 }
    });
  }

  if (!user.isActive) {
    throw authError('Your account is deactivated. Please contact support.', 403);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    const newAttempts = user.failedLoginAttempts + 1;
    const updateData = { failedLoginAttempts: newAttempts };

    if (user.role !== 'ADMIN' && newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.isLocked = true;
      updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
    }

    await prisma.user.update({ where: { id: user.id }, data: updateData });

    if (user.role === 'ADMIN') {
      throw authError('Invalid email or password', 401);
    }
    throw authError(`Invalid email or password. ${Math.max(0, MAX_LOGIN_ATTEMPTS - newAttempts)} attempt(s) remaining.`, 401);
  }

  // Successful login - reset failed attempts and update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      isLocked: false,
      lockedUntil: null,
      lastLogin: new Date(),
      lastLoginIp: ipAddress
    }
  });

  // Create session
  const tokens = generateTokens({ id: user.id, role: user.role });
  await createSession(user.id, tokens.refreshToken, ipAddress);

  // Log activity
  await createActivityLog({
    userId: user.id,
    type: 'LOGIN',
    message: `User ${user.name} logged in`,
    ipAddress
  });

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    notificationPrefs: user.notificationPrefs,
    emergencyContact: user.emergencyContact,
    emergencyContactName: user.emergencyContactName,
    profileImageUrl: user.profileImageUrl,
    // Direct database fields (already exist in Prisma schema)
    weight: user.weight || '',
    bloodType: user.bloodType || '',
    height: user.height || '',
    lastVisit: user.lastVisit || '',
    diseases: user.diseases || '',
    allergies: user.allergies || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || '',
    address: user.address || ''
  };

  return { user: safeUser, ...tokens };
};

/**
 * Refresh tokens with rotation
 */
export const refreshTokens = async ({ refreshToken, ipAddress }) => {
  // Verify the refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw authError('Invalid or expired refresh token', 401);
  }

  // Check if session exists and is valid
  const session = await prisma.userSession.findUnique({
    where: { refreshToken }
  });

  if (!session || session.isRevoked) {
    throw authError('Session has been revoked. Please log in again.', 401);
  }

  if (new Date() > session.expiresAt) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: { isRevoked: true }
    });
    throw authError('Session expired. Please log in again.', 401);
  }

  // Revoke old session (rotation)
  await prisma.userSession.update({
    where: { id: session.id },
    data: { isRevoked: true }
  });

  // Generate new tokens
  const tokens = generateTokens({ id: decoded.id, role: decoded.role });

  // Create new session
  await createSession(decoded.id, tokens.refreshToken, ipAddress);

  return tokens;
};

/**
 * Logout - revoke all sessions
 */
export const logoutUser = async (userId, refreshToken) => {
  if (refreshToken) {
    await prisma.userSession.updateMany({
      where: { refreshToken, userId },
      data: { isRevoked: true }
    });
  } else {
    // Revoke all sessions for user
    await prisma.userSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true }
    });
  }

  await createActivityLog({
    userId,
    type: 'LOGOUT',
    message: 'User logged out',
  });
};

/**
 * Initiate password reset
 */
export const initiatePasswordReset = async (email) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  
  // Don't reveal whether the email exists
  if (!user) {
    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  // Generate reset token (expires in 1 hour)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    }
  });

  const resetUrl = new URL('/reset-password', config.FRONTEND_URL);
  resetUrl.searchParams.set('token', resetToken);
  resetUrl.searchParams.set('email', normalizedEmail);
  const emailHtml = '<p>A password reset was requested for your account.</p>' +
    `<p><a href="${resetUrl.toString()}">Set a new password</a></p>` +
    '<p>This link expires in one hour. If you did not request a reset, you can ignore this email.</p>';
  await sendEmail(user.email, 'Reset your KCRH SmartQueue password', emailHtml, user.id, { sensitive: true });

  return { message: 'If that email is registered, a reset link has been sent.' };
};

/**
 * Complete password reset with token verification
 */
export const completePasswordReset = async ({ email, token, newPassword }) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  // Password strength validation
  const passwordErrors = validatePasswordStrength(newPassword);
  if (passwordErrors.length > 0) {
    throw authError(passwordErrors.join('; '), 400);
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw authError('Invalid or expired reset token', 400);
  }

  // Hash the provided token for lookup
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      token: hashedToken,
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!resetRecord) {
    throw authError('Invalid or expired reset token', 400);
  }

  // Hash new password and update user
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, failedLoginAttempts: 0, isLocked: false, lockedUntil: null }
  });

  // Mark token as used
  await prisma.passwordResetToken.update({
    where: { id: resetRecord.id },
    data: { usedAt: new Date() }
  });

  // Revoke all sessions (force re-login)
  await prisma.userSession.updateMany({
    where: { userId: user.id, isRevoked: false },
    data: { isRevoked: true }
  });

  await createActivityLog({
    userId: user.id,
    type: 'PASSWORD_RESET',
    message: 'Password was reset successfully',
  });

  return { message: 'Password has been reset successfully. Please log in with your new password.' };
};

/**
 * Helper: Create a user session
 */
async function createSession(userId, refreshToken, ipAddress, database = prisma) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await database.userSession.create({
    data: {
      userId,
      refreshToken,
      ipAddress,
      expiresAt
    }
  });
}

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, data) => {
  const updateData = {};

  if (data.name) updateData.name = data.name.trim();
  if (data.email) {
    const normalizedEmail = data.email.trim().toLowerCase();
    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && existing.id !== userId) {
      throw authError('Email is already in use', 409);
    }
    updateData.email = normalizedEmail;
  }
  if (data.phone) {
    const normalizedPhone = data.phone.trim();
    // Check for duplicate phone
    const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (existing && existing.id !== userId) {
      throw authError('Phone number is already in use', 409);
    }
    updateData.phone = normalizedPhone;
  }
  if (data.password) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });
    if (!currentUser || !(await bcrypt.compare(data.currentPassword || '', currentUser.password))) {
      throw authError('Current password is incorrect', 401);
    }
    updateData.password = await bcrypt.hash(data.password, 12);
  }
  if (data.notificationPrefs) updateData.notificationPrefs = data.notificationPrefs;
  if (data.emergencyContact) updateData.emergencyContact = data.emergencyContact;
  if (data.emergencyContactName) updateData.emergencyContactName = data.emergencyContactName;
  if (data.profileImageUrl) updateData.profileImageUrl = data.profileImageUrl;
  // Patient medical fields (direct Prisma fields — already exist in schema)
  if (data.weight !== undefined) updateData.weight = data.weight;
  if (data.bloodType !== undefined) updateData.bloodType = data.bloodType;
  if (data.height !== undefined) updateData.height = data.height;
  if (data.lastVisit !== undefined) updateData.lastVisit = data.lastVisit;
  if (data.diseases !== undefined) updateData.diseases = data.diseases;
  if (data.allergies !== undefined) updateData.allergies = data.allergies;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
  if (data.address !== undefined) updateData.address = data.address;

  if (Object.keys(updateData).length === 0) {
    throw authError('No fields to update', 400);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      lastLogin: true,
      notificationPrefs: true,
      emergencyContact: true,
      emergencyContactName: true,
      profileImageUrl: true,
      weight: true,
      bloodType: true,
      height: true,
      lastVisit: true,
      diseases: true,
      allergies: true,
      gender: true,
      dateOfBirth: true,
      address: true,
      createdAt: true
    }
  });

  await createActivityLog({
    userId,
    type: 'PROFILE_UPDATE',
    message: 'Profile information updated',
  });

  return user;
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      lastLogin: true,
      lastLoginIp: true,
      notificationPrefs: true,
      emergencyContact: true,
      emergencyContactName: true,
      profileImageUrl: true,
      weight: true,
      bloodType: true,
      height: true,
      lastVisit: true,
      diseases: true,
      allergies: true,
      gender: true,
      dateOfBirth: true,
      address: true,
      createdAt: true
    }
  });

  if (!user) {
    throw authError('User not found', 404);
  }

  return user;
};

