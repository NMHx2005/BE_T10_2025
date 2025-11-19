import express from 'express';
import dashboardRoutes from './dashboard.route.js';
import productRoutes from './products.route.js';
import userRoutes from './users.route.js';
import categoryRoutes from './categories.route.js';

const router = express.Router();

// Admin routes
router.use('/', dashboardRoutes);
router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);

export default router;