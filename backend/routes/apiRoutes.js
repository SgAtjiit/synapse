import express from 'express';
import { getUserHistory, getRoomDetails } from '../controllers/apiController.js';

const router = express.Router();

// Get user's room history
router.get('/history/:firebaseUid', getUserHistory);

// Get room details
router.get('/room/:roomId', getRoomDetails);

export default router;
