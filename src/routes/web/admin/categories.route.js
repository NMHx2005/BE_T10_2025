import express from 'express';
import { getAllCategories, getCategoryForm } from '../../../controllers/admin/page.controllers.js';

const router = express.Router();

// Category management
router.get('/', getAllCategories);
router.get('/:id', getCategoryForm);

export default router;