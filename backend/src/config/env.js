import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  NOTIFICATION_ENABLED: process.env.NOTIFICATION_ENABLED === 'true',
  AT: {
    USERNAME: process.env.AT_USERNAME || 'sandbox',
    API_KEY: process.env.AT_API_KEY || '',
    SENDER_ID: process.env.AT_SENDER_ID || 'KCRH'
  },
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.EMAIL_FROM || 'Kilifi County Referral Hospital <noreply@kcrh.go.ke>'
  }
};

// Validate critical variables
if (!config.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL env variable is not set. Database connections will fail.');
}

// Ensure JWT secrets are provided in non-development environments
if (!config.JWT.ACCESS_SECRET || !config.JWT.REFRESH_SECRET) {
  const msg = 'CRITICAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables.';
  if (config.NODE_ENV === 'production') {
    // Fail fast in production to avoid using insecure defaults
    throw new Error(msg);
  } else {
    console.warn(`WARNING: ${msg} Falling back to temporary in-memory secrets for development.`);
    // Provide temporary secrets for development convenience
    config.JWT.ACCESS_SECRET = config.JWT.ACCESS_SECRET || 'dev-access-secret-please-change';
    config.JWT.REFRESH_SECRET = config.JWT.REFRESH_SECRET || 'dev-refresh-secret-please-change';
  }
}

export default config;
