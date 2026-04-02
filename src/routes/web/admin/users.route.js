import express from 'express';
import { getAllUsers, getUserDetail } from '../../../controllers/admin/page.controllers.js';
import { protect, adminOnly } from '../../../middleware/auth.js';

const router = express.Router();

// All admin user routes require admin authentication
router.use(protect, adminOnly);

// User list and detail
router.get('/', getAllUsers);
router.get('/:id', getUserDetail);

export default router;