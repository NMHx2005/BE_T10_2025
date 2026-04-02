import express from 'express';
import { getAllProducts, getProductForm } from '../../../controllers/admin/page.controllers.js';
import { protect, adminOnly } from '../../../middleware/auth.js';

const router = express.Router();

// All admin product routes require admin authentication
router.use(protect, adminOnly);

// Product list and management
router.get('/', getAllProducts);
router.get('/create', getProductForm);
router.get('/:id', getProductForm);

export default router;