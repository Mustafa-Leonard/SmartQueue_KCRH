/**
 * Two-Factor Authentication (TOTP) Service
 * 
 * Implements Time-based One-Time Password (TOTP) for 2FA.
 * Uses crypto for TOTP generation/verification without external dependencies.
 */

import crypto from 'crypto';
import prisma from '../../config/database.js';

const TOTP_STEP_SECONDS = 30;    // Time step in seconds
const TOTP_WINDOW = 1;           // Allowed time window (steps before/after)
const TOTP_DIGITS = 6;           // Number of digits in TOTP

/**
 * Generate a base32-encoded secret for TOTP
 */
export const generateSecret = () => {
  const key = crypto.randomBytes(20);
  return base32Encode(key);
};

/**
 * Base32 encoding (RFC 4648) for TOTP secrets
 */
const base32Encode = (buffer) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
};

/**
 * Generate HMAC-SHA1 based TOTP value
 */
const generateTOTP = (secret, counter) => {
  const decodedSecret = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    buffer[i] = counter & 0xff;
    counter >>= 8;
  }

  const hmac = crypto.createHmac('sha1', decodedSecret);
  hmac.update(buffer);
  const hmacResult = hmac.digest();

  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const binaryCode =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const totp = binaryCode % Math.pow(10, TOTP_DIGITS);
  return totp.toString().padStart(TOTP_DIGITS, '0');
};

/**
 * Base32 decoding
 */
const base32Decode = (input) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  input = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < input.length; i++) {
    const idx = alphabet.indexOf(input[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

/**
 * Get the current time counter for TOTP
 */
const getTimeCounter = (time = Date.now()) => {
  return Math.floor(time / 1000 / TOTP_STEP_SECONDS);
};

/**
 * Generate a TOTP token for a given secret at a given time
 */
export const generateToken = (secret, time = Date.now()) => {
  const counter = getTimeCounter(time);
  return generateTOTP(secret, counter);
};

/**
 * Verify a TOTP token against a secret
 */
export const verifyToken = (secret, token) => {
  const counter = getTimeCounter();
  
  // Check current and adjacent time windows
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const expected = generateTOTP(secret, counter + i);
    if (expected === token) {
      return true;
    }
  }
  
  return false;
};

/**
 * Generate the otpauth:// URI for QR code provisioning
 */
export const generateOTPAuthURI = (secret, email) => {
  const issuer = 'KCRH SmartQueue';
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;
};

/**
 * Enable 2FA for a user
 */
export const enable2FA = async (userId) => {
  const secret = generateSecret();
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: false // Will be set to true after verification
    }
  });

  // Get user email for provisioning URI
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  return {
    secret,
    uri: generateOTPAuthURI(secret, user.email)
  };
};

/**
 * Verify and activate 2FA for a user
 */
export const verifyAndActivate2FA = async (userId, token) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true }
  });

  if (!user.twoFactorSecret) {
    throw new Error('2FA not initialized. Generate a secret first.');
  }

  const isValid = verifyToken(user.twoFactorSecret, token);
  
  if (!isValid) {
    throw new Error('Invalid verification code. Please try again.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true }
  });

  return { success: true };
};

/**
 * Disable 2FA for a user
 */
export const disable2FA = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false
    }
  });

  return { success: true };
};

/**
 * Middleware to check if 2FA is required (for use in login flow)
 */
export const require2FA = async (userId, token) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true, twoFactorSecret: true }
  });

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return { required: false };
  }

  if (!token) {
    return { required: true, message: '2FA code required' };
  }

  const isValid = verifyToken(user.twoFactorSecret, token);
  if (!isValid) {
    throw new Error('Invalid 2FA code');
  }

  return { required: true, verified: true };
};

