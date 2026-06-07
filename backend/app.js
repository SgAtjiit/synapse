import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Mount all routes
app.use('/', routes);

// Export app and corsOptions for server.js
export { app, corsOptions };
