import express from 'express';
import { getProfile } from '../../controllers/client/user.controllers.js';
import { adminOnly, protect } from '../../middleware/auth.js';


const router = express.Router();

// GET /api/v1/users/profile - Lấy thông tin người dùng
router.get('/profile', protect, getProfile);

// Cập nhật profile


// middleware protect sẽ kiểm tra auth trước khi vào controller


// Admin
// Lấy ra tất cả người dùng
router.get('/', protect, adminOnly, getAllUsers);

// Lấy thông tin theo id

// Cập nhật user

// Xóa user







export default router;