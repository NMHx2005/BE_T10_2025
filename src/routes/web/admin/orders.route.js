import express from 'express';
import { getAllOrders, getOrderDetail } from '../../../controllers/admin/page.controllers.js';

const router = express.Router();

// Order list and detail
router.get('/', getAllOrders);
router.get('/:id', getOrderDetail);

export default router;
