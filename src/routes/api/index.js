import express from 'express';
import authRoutes from './auth.route.js';
import productRoutes from './products.route.js';
import categoryRoutes from './categories.route.js';
import userRoutes from './users.route.js';

const router = express.Router();

// API versioning
router.use('/v1/auth', authRoutes);
router.use('/v1/products', productRoutes);
router.use('/v1/categories', categoryRoutes);
router.use('/v1/users', userRoutes);

export default router;