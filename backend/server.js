import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { app, corsOptions } from './app.js';
import { setupSocketHandlers } from './services/socketHandler.js';

// Load environment variables
dotenv.config();

// Create HTTP server
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
    })
    .catch((error) => {
      console.error('❌ MongoDB connection error:', error.message);
      console.log('⚠️  Running without database - data will not persist');
    });
} else {
  console.log('⚠️  MONGODB_URI not set - running without database');
  console.log('   Set MONGODB_URI in .env file to enable persistence');
}

// Setup Socket handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚡ SYNAPSE BACKEND SERVER                               ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║   WebSocket ready on: ws://localhost:${PORT}               ║
║                                                           ║
║   MongoDB: ${MONGODB_URI ? 'Configured' : 'Not configured (set MONGODB_URI)'}               ║
║   Gemini: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured (set GEMINI_API_KEY)'}                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});
