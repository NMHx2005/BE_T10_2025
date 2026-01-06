import express from 'express';
import { register, login, logout } from '../../controllers/client/auth.controllers.js';
import { changePassword, resetPassword } from '../../controllers/auth/password.controllers.js';
import { protect } from '../../middleware/auth.js';

const { body, validationResult } = await import('express-validator');

const router = express.Router();


// POST /api/v1/auth/register - Đăng kí người dùng mới
router.post('/register',
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    register
);


// POST /api/v1/auth/login - Đăng nhập
router.post('/login', login);

// POST /api/v1/auth/reset-password/:token - Đặt lại mật khẩu
router.post('/reset-password/:token', resetPassword);

// POST /api/v1/auth/change-password - Đổi mật khẩu
router.post('/change-password', protect, changePassword);

// POST /api/v1/auth/logout - Đăng xuất
router.post('/logout', logout);


export default router;