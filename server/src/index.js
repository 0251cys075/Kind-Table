/**
 * Kind Table Server Entry Point
 * Express application + HTTP server + WebSocket live notifications
 * Capstone Group 76: Zero Hunger (SDG 2)
 */

import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import apiRoutes from './routes/api.js';
import { initWebSocketServer, closeWebSocketServer } from './services/websocket.js';
import { startExpiryJob, stopExpiryJob } from './jobs/expiryJob.js';
import { seedDemoData, closeDatabase } from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support state backup payloads

// API Endpoints
app.use('/api', apiRoutes);

// WebSocket for live alerts
initWebSocketServer(server);

// Start background expiry cleaner (checks every 5 seconds)
startExpiryJob(5000);

// Seed initial demo data if database is fresh
try {
  seedDemoData();
} catch (err) {
  console.warn('Initial demo data check:', err.message);
}

// Serve client in production if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred. Please try again.',
  });
});

function startServer(port = PORT) {
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[Kind Table Server] Running on http://localhost:${port}`);
      console.log(`[Kind Table Live Alert Stream] ws://localhost:${port}/ws`);
      resolve(server);
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    stopExpiryJob();
    closeWebSocketServer();
    server.close(() => {
      closeDatabase();
      resolve();
    });
  });
}

// Auto start if run directly or not disabled
if (process.env.AUTO_START !== 'false') {
  startServer();
}

export { app, server, startServer, stopServer };
