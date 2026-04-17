import express from 'express';
import {
    createProductController,
    getProducts,
    getProductsDetail,
    softDeleteProductController,
    restoreDeletedProductController,
    searchProduct,
    updateFullProductController,
    updateProductController,
    getProductsByCategory,
    getCategoryStatsController,
    getCategoryFiltersController,
} from '../../controllers/client/product.controller.js';
import { adminOnly, optionalAuth, protect } from '../../middleware/auth.js';
import { createProductValidation, updateProductValidation } from '../../middleware/validators/product.validator.js';


const router = express.Router();

// ========== SEARCH & FILTER (đặt trước /:id vì Express xử lý theo thứ tự) ==========

// GET /api/products/search?q=keyword - Tìm kiếm full-text
router.get('/search', searchProduct);

// GET /api/products/category/:categoryId - Lọc theo category (hỗ trợ tree)
router.get('/category/:categoryId', optionalAuth, getProductsByCategory);

// GET /api/products/category/:categoryId/filters - Lấy filter options cho category
router.get('/category/:categoryId/filters', getCategoryFiltersController);

// GET /api/products/category-stats/:categoryId - Lấy thống kê category
router.get('/category-stats/:categoryId', getCategoryStatsController);


// ========== GENERAL QUERIES ==========

// GET /api/products - Lấy danh sách sản phẩm (hỗ trợ filter general)
router.get('/', optionalAuth, getProducts);

// ========== DETAIL & ADMIN ==========

// Lấy chi tiết sản phẩm theo ID
router.get('/:id', optionalAuth, getProductsDetail);

// Cần đăng nhập - POST /api/products - Tạo sản phẩm mới
router.post('/', protect, adminOnly, createProductValidation, createProductController);

// PUT /products/:id - Cập nhật toàn bộ thông tin sản phẩm
router.put('/:id', protect, adminOnly, updateProductValidation, updateFullProductController);

/**
 * PATCH /api/v1/products/:id/restore — Khôi phục sau xóa mềm (đặt trước PATCH /:id)
 */
router.patch('/:id/restore', protect, adminOnly, restoreDeletedProductController);

// PATCH /products/:id - Cập nhật một phần thông tin sản phẩm
router.patch('/:id', protect, adminOnly, updateProductController);

/**
 * DELETE /api/v1/products/:id — Xóa mềm (admin)
 */
router.delete('/:id', protect, adminOnly, softDeleteProductController);

export default router;