import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from './env.js';
import prisma from './database.js';

let io = null;
let displayNamespace = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (config.NODE_ENV === 'development') return callback(null, true);
        const allowed = [config.FRONTEND_URL, 'http://localhost:5173'];
        if (allowed.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Authentication Middleware for Sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      const decoded = jwt.verify(cleanToken, config.JWT.ACCESS_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, role: true }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.info(`Socket connected: ${socket.id} (User: ${socket.user.name}, Role: ${socket.user.role})`);

    // Dynamic Room Joins
    socket.on('join:branch', ({ branchId }) => {
      if (branchId) {
        const roomName = `branch:${branchId}`;
        socket.join(roomName);
        console.info(`Socket ${socket.id} joined room ${roomName}`);
      }
    });

    socket.on('leave:branch', ({ branchId }) => {
      if (branchId) {
        const roomName = `branch:${branchId}`;
        socket.leave(roomName);
        console.info(`Socket ${socket.id} left room ${roomName}`);
      }
    });

    socket.on('join:ticket', ({ ticketCode }) => {
      if (ticketCode) {
        const roomName = `ticket:${ticketCode}`;
        socket.join(roomName);
        console.info(`Socket ${socket.id} joined room ${roomName}`);
      }
    });

    socket.on('leave:ticket', ({ ticketCode }) => {
      if (ticketCode) {
        const roomName = `ticket:${ticketCode}`;
        socket.leave(roomName);
        console.info(`Socket ${socket.id} left room ${roomName}`);
      }
    });

    socket.on('disconnect', () => {
      console.info(`Socket disconnected: ${socket.id}`);
    });
  });

  // ── Display Board Public Namespace (no auth required) ──
  displayNamespace = io.of('/display');
  displayNamespace.on('connection', (socket) => {
    console.info(`Display Board connected: ${socket.id}`);

    socket.on('join:display', ({ branchId }) => {
      if (branchId) {
        const roomName = `display:${branchId}`;
        socket.join(roomName);
        console.info(`Display ${socket.id} joined room ${roomName}`);
      }
    });

    socket.on('leave:display', ({ branchId }) => {
      if (branchId) {
        const roomName = `display:${branchId}`;
        socket.leave(roomName);
        console.info(`Display ${socket.id} left room ${roomName}`);
      }
    });

    socket.on('disconnect', () => {
      console.info(`Display Board disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io must be initialized first!');
  }
  return io;
};

export const getDisplayNamespace = () => {
  if (!displayNamespace) {
    throw new Error('Display namespace must be initialized first!');
  }
  return displayNamespace;
};
