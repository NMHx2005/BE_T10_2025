import express from 'express';
import {
    getOrders,
    getOrderDetail,
    createOrder,
    updateOrder,
    cancelOrder,
    deleteOrder
} from '../../controllers/client/order.controller.js';
import { protect, adminOnly } from '../../middleware/auth.js';

const router = express.Router();

// User routes (protect middleware)
// GET /api/orders - Lấy danh sách đơn hàng của user
router.get('/', protect, getOrders);

// GET /api/orders/:id - Lấy chi tiết đơn hàng
router.get('/:id', protect, getOrderDetail);

// POST /api/orders - Tạo đơn hàng
router.post('/', protect, createOrder);

// PATCH /api/orders/:id/cancel - Hủy đơn hàng
router.patch('/:id/cancel', protect, cancelOrder);

// Admin routes
// PUT /api/orders/:id - Cập nhật đơn hàng (admin)
router.put('/:id', protect, adminOnly, updateOrder);

// DELETE /api/orders/:id - Xóa đơn hàng (admin)
router.delete('/:id', protect, adminOnly, deleteOrder);

export default router;
