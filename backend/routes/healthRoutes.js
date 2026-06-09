import express from 'express';
import { getHealth, getInfo } from '../controllers/healthController.js';

const router = express.Router();

// API info
router.get('/', getInfo);

// Health check
router.get('/health', getHealth);

export default router;
