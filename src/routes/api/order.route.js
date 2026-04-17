import express from 'express';
import {
    getOrders,
    getOrderDetail,
    createOrder,
    createCheckout,
    lookupOrder,
    updateOrder,
    cancelOrder,
    deleteOrder,
    exportOrdersCsv,
} from '../../controllers/client/order.controller.js';
import { protect, adminOnly } from '../../middleware/auth.js';

const router = express.Router();

// User routes (protect middleware)
// GET /api/orders - Lấy danh sách đơn hàng của user
router.get('/', protect, getOrders);

// GET /api/v1/orders/export/csv — Admin CSV (đặt trước /:id)
router.get('/export/csv', protect, adminOnly, exportOrdersCsv);

// Tra cứu đơn (không đăng nhập) — đặt trước /:id
router.post('/lookup', lookupOrder);

// Checkout (COD hoặc PayOS)
router.post('/checkout', protect, createCheckout);

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
