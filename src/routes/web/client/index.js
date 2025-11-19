import express from 'express';
import homeRoutes from './home.route.js';
import productRoutes from './products.route.js';
import authRoutes from './auth.route.js';
import profileRoutes from './profile.route.js';

const router = express.Router();

// Client routes
router.use('/', homeRoutes);
router.use('/products', productRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);

export default router;