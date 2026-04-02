import express from 'express';
import { getAllCategories } from '../../../controllers/admin/page.controllers.js';
import { protect, adminOnly } from '../../../middleware/auth.js';

const router = express.Router();

// All admin category routes require admin authentication
router.use(protect, adminOnly);

// Category management
router.get('/', getAllCategories);

export default router;