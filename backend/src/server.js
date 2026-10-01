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
    const port = Number(config.PORT);
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      throw new Error(`Invalid PORT value: ${config.PORT}`);
    }

    // Verify database connection
    console.info('Connecting to database...');
    await prisma.$connect();
    console.info('Database connection established successfully.');

    // Await listener errors so port conflicts produce a useful startup message.
    await new Promise((resolve, reject) => {
      const onError = (error) => {
        server.off('listening', onListening);
        reject(error);
      };
      const onListening = () => {
        server.off('error', onError);
        resolve();
      };

      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(port);
    });

    console.info('===================================================');
    console.info(' SmartQueue Backend started successfully!');
    console.info(` Port: ${server.address().port}`);
    console.info(` Environment: ${config.NODE_ENV}`);
    console.info(` API docs: ${config.FRONTEND_URL}/docs`);
    console.info('===================================================');
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`Failed to start server: port ${config.PORT} is already in use. Stop the existing backend or configure a different PORT.`);
    } else {
      console.error('Failed to start server:', error.message);
    }
    await prisma.$disconnect();
    process.exitCode = 1;
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
