import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './services/socketHandler.js';
import UserHistory from './models/UserHistory.js';
import Room from './models/Room.js';
import Message from './models/Message.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  methods: ['GET', 'POST'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.io setup
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Synapse Backend',
    version: '1.0.0',
    description: 'Real-Time Collaborative AI Workspace Server',
    endpoints: {
      health: '/health',
      websocket: 'ws://localhost:' + (process.env.PORT || 3001),
      history: '/api/history/:firebaseUid',
      room: '/api/room/:roomId',
    },
  });
});

// Get user's room history
app.get('/api/history/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const history = await UserHistory.getByUser(firebaseUid);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

// Get room details (for history view)
app.get('/api/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ id: roomId });
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const messages = await Message.getByRoom(roomId);

    res.json({
      success: true,
      room: room.toObject(),
      messages,
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch room' });
  }
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
