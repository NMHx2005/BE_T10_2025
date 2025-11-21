import express from 'express';
import { register, login, logout } from '../../controllers/client/auth.controllers.js';


const router = express.Router();


// POST /api/v1/auth/register - Đăng kí người dùng mới
router.post('/register', register);


// POST /api/v1/auth/login - Đăng nhập
router.post('/login', login);


// POST /api/v1/auth/logout - Đăng xuất
router.post('/logout', logout);


export default router;