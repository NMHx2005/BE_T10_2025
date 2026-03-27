import express from 'express';
import { createProductController, deleteProductController, getProducts, getProductsDetail, restoreProductController, updateFullProductController, updateProductController } from '../../controllers/client/product.controller.js';
import { adminOnly, optionalAuth, protect } from '../../middleware/auth.js';
import { createProductValidation, updateProductValidation } from '../../middleware/validators/product.validator.js';


const router = express.Router();

// Ai cũng xem được
// Lấy ra danh sách sản phẩm
router.get('/', optionalAuth, getProducts);


// Lấy ra chi tiết sản phẩm
router.get('/:id', optionalAuth, getProductsDetail);

router.get('/search', searchProduct);
/**
 * API gợi ý khi user đang gõ
 * GET /api/products/search/suggestions?q=iph
 */
router.get('/search/suggestions', searchProduct);

// Cần đăng nhập
// POST /api/v1/products - Tạo sản phẩm mới
// router.post('/', protect, adminOnly, createProductValidation, createProductController);
router.post('/', protect, adminOnly, createProductValidation, createProductController);


// PUT /products/:id - Cập nhật toàn bộ thông tin sản phẩm
router.put('/:id', protect, adminOnly, updateProductValidation, updateFullProductController);


// PATCH /products/:id - Cập nhật một phần thông tin sản phẩm
router.patch('/:id', protect, adminOnly, updateProductController);


/**
 * PATCH /api/products/:id/restore
 * Khôi phục sản phẩm đã soft delete
 */
router.patch("/:id/restore", protect, adminOnly, restoreProductController);
/**
 * DELETE /api/products/:id/force
 * Xóa vĩnh viễn khỏi DB (dangerous)
 */
router.delete("/:id/force", protect, adminOnly, deleteProductController);

export default router;