import express from 'express';

// Import route modules
import apiRoutes from './api/index.js';
import webRoutes from './web/index.js';

const router = express.Router();

// API Routes
router.use('/api', apiRoutes);

// Web Routes
router.use('/', webRoutes);

export default router;