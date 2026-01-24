import mongoose from 'mongoose';

// Health check
export const getHealth = (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
    });
};

// API info
export const getInfo = (req, res) => {
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
};
