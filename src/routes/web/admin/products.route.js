import express from 'express';
import { getAllProducts, getProductForm } from '../../../controllers/admin/page.controllers.js';

const router = express.Router();

// Product list and management
router.get('/', getAllProducts);
router.get('/create', getProductForm);
router.get('/:id', getProductForm);

export default router;