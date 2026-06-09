import express from 'express';
import { getCompletion } from '../controllers/autocompleteController.js';

const router = express.Router();

// Get AI text completion
router.post('/autocomplete', getCompletion);

export default router;
