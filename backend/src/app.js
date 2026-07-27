import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/env.js';

// Middleware imports
import errorHandler from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { logApiRequest } from './modules/audit/audit.service.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import branchRoutes from './modules/branches/branch.routes.js';
import serviceRoutes from './modules/services/service.routes.js';
import counterRoutes from './modules/counters/counter.routes.js';
import queueRoutes from './modules/queues/queue.routes.js';
import ticketRoutes from './modules/tickets/ticket.routes.js';
import appointmentRoutes from './modules/appointments/appointment.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import taskRoutes from './modules/tasks/task.routes.js';
import feedbackRoutes from './modules/feedback/feedback.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import hmisRoutes from './modules/hmis/hmis.routes.js';
import twofaRoutes from './modules/twofa/twofa.routes.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.NODE_ENV === 'development') return callback(null, true);
    const allowed = [config.FRONTEND_URL, 'http://localhost:5173'];
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all requests
app.use(globalLimiter);

// API Request logging middleware (non-intrusive)
app.use('/api', (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode < 400) { // Only log successful requests to avoid noise
      logApiRequest({
        userId: req.user?.id,
        method: req.method,
        path: req.originalUrl,
        query: req.query,
        statusCode: res.statusCode,
        duration,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(() => {});
    }
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});

// Mount module routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/hmis', hmisRoutes);
app.use('/api/auth/2fa', twofaRoutes);

// Catch-all route not found
app.use((req, res, next) => {
  const error = new Error(`Cannot find ${req.originalUrl} on this server`);
  error.status = 404;
  next(error);
});

// Centralized error handler
app.use(errorHandler);

export default app;
