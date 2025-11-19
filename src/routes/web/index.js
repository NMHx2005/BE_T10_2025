import express from 'express';
import clientRoutes from './client/index.js';
import adminRoutes from './admin/index.js';

const router = express.Router();

// Client routes
router.use('/', clientRoutes);

// Admin routes
router.use('/admin', adminRoutes);

export default router;