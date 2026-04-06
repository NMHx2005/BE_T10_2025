import express from 'express';
import { getAllCategories } from '../../../controllers/admin/page.controllers.js';

const router = express.Router();

// Category management
router.get('/', getAllCategories);

export default router;