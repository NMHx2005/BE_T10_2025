import express from 'express';
import {
    getAllCategories,
    getCategoryDetail,
    createCategory,
    updateCategory,
    deleteCategory
} from '../../controllers/client/category.controller.js';
import { protect, adminOnly, optionalAuth } from '../../middleware/auth.js';

const router = express.Router();

// Public routes
// GET /api/categories - Lấy danh sách tất cả categories (tree structure)
router.get('/', optionalAuth, getAllCategories);

// GET /api/categories/:id - Lấy chi tiết category
router.get('/:id', optionalAuth, getCategoryDetail);

// Admin routes
// POST /api/categories - Tạo danh mục mới
router.post('/', protect, adminOnly, createCategory);

// PUT /api/categories/:id - Cập nhật danh mục
router.put('/:id', protect, adminOnly, updateCategory);

// DELETE /api/categories/:id - Xóa danh mục
router.delete('/:id', protect, adminOnly, deleteCategory);

export default router;