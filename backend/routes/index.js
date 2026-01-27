import express from 'express';
import healthRoutes from './healthRoutes.js';
import apiRoutes from './apiRoutes.js';
import autocompleteRoutes from './autocompleteRoutes.js';

const router = express.Router();

// Mount routes
router.use('/', healthRoutes);
router.use('/api', apiRoutes);
router.use('/api', autocompleteRoutes);

export default router;
