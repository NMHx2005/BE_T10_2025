import express from 'express';
import authRoutes from './auth.route.js';
import productRoutes from './products.route.js';
import categoryRoutes from './categories.route.js';
import userRoutes from './users.route.js';
import uploadRoutes from './upload.route.js';
import orderRoutes from './order.route.js';
import webhooksRoutes from './webhooks.route.js';

const router = express.Router();

// API versioning
router.use('/v1/auth', authRoutes);
router.use('/v1/products', productRoutes);
router.use('/v1/categories', categoryRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/upload', uploadRoutes);
router.use('/v1/webhooks', webhooksRoutes);
router.use('/v1/orders', orderRoutes);

export default router;