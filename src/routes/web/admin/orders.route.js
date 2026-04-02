import express from 'express';
import { getAllOrders, getOrderDetail } from '../../../controllers/admin/page.controllers.js';
import { protect, adminOnly } from '../../../middleware/auth.js';

const router = express.Router();

// All admin order routes require admin authentication
router.use(protect, adminOnly);

// Order list and detail
router.get('/', getAllOrders);
router.get('/:id', getOrderDetail);

export default router;
