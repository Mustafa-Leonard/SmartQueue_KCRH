import http from 'http';
import app from './app.js';
import config from './config/env.js';
import { initSocket } from './config/socket.js';
import prisma from './config/database.js';

const server = http.createServer(app);

// Initialize Sockets
const io = initSocket(server);
app.locals.io = io; // Attach to express local context for accessibility

const startServer = async () => {
  try {
    // Verify database connection
    console.info('Connecting to database...');
    await prisma.$connect();
    console.info('Database connection established successfully.');

    // Start HTTP server
    server.listen(config.PORT, () => {
      console.info(`===================================================`);
      console.info(` SmartQueue Backend started successfully!`);
      console.info(` Port: ${config.PORT}`);
      console.info(` Environment: ${config.NODE_ENV}`);
      console.info(` API docs: ${config.FRONTEND_URL}/docs`);
      console.info(`===================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Handle process termination cleanly
const shutdown = async () => {
  console.info('Shutting down server gracefully...');
  server.close(async () => {
    console.info('HTTP server closed.');
    await prisma.$disconnect();
    console.info('Database connections disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
