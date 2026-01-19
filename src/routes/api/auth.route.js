import express from 'express';
import { register, login, logout, refreshToken } from '../../controllers/client/auth.controllers.js';
import { changePassword, resetPassword } from '../../controllers/auth/password.controllers.js';
import { protect } from '../../middleware/auth.js';
import { loginValidation, registerValidation } from '../../middleware/validators/auth.validator.js';

const router = express.Router();


// POST /api/v1/auth/register - Đăng kí người dùng mới
router.post('/register', registerValidation, register);

// POST /api/v1/auth/login - Đăng nhập
router.post('/login', loginValidation, login);

// POST /api/v1/auth/refresh - Refresh Token
router.post('/refresh', refreshToken);

// POST /api/v1/auth/reset-password/:token - Đặt lại mật khẩu
router.post('/reset-password/:token', resetPassword);

// POST /api/v1/auth/change-password - Đổi mật khẩu
router.post('/change-password', protect, changePassword);

// POST /api/v1/auth/logout - Đăng xuất
router.post('/logout', logout);


export default router;