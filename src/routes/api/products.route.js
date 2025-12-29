import express from 'express';
import { createProductController, deleteProductController, getProducts, getProductsDetail, updateFullProductController, updateProductController } from '../../controllers/client/product.controller.js';
import { adminOnly, optionalAuth, protect } from '../../middleware/auth.js';


const router = express.Router();

// Ai cũng xem được
// Lấy ra danh sách sản phẩm
router.get('/', optionalAuth, getProducts);


// Lấy ra chi tiết sản phẩm
router.get('/', optionalAuth, getProductsDetail);



// Cần đăng nhập
// POST /api/v1/products - Tạo sản phẩm mới
router.post('/', protect, adminOnly, createProductController);


// PUT /products/:id - Cập nhật toàn bộ thông tin sản phẩm
router.put('/:id', protect, adminOnly, updateFullProductController);


// PATCH /products/:id - Cập nhật một phần thông tin sản phẩm
router.patch('/:id', protect, adminOnly, updateProductController);



// Delete /products/:id - Xóa sản phẩm
router.delete('/', protect, adminOnly, deleteProductController);



export default router;