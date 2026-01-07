import express from 'express';

// Import route modules
import apiRoutes from './api/index.js';
import webRoutes from './web/index.js';
import { decodeToken } from '../config/jwt.js';
import User from '../models/User.js';


// express.Router(): tạo ra router mới
const router = express.Router();

// Routes định nghĩa URL
// Ví dụ: /api/products
// Giống như bản đồ: URL -> Xử lý tưởng ứng (Controller xử lý logic)

// MVC: model - view - controller
// Mtinh -> v -> c -> model -> c (slug) -> v -> mtinh

// Dễ quản lí khi nhiều routes, Dễ bảo trì và mở rộng, tách biệt logic với chức năng


// Tách routes theo chức năng
// Tái sử dụng middleware
// 1 - c - m (middlaware)
// user - v - (middleware check -> kick) => đi thẳng


// API Routes: mọi URL bắt đầu bằng /api sẽ được xử lý bởi apiRoutes
router.use('/api', apiRoutes);

// Web Routes: Khi user truy cập website: Các url khác sẽ được xử lý bởi webRoutes
router.use('/', webRoutes);

router.get('/verify-email', async (req, res, next) => {
    const { token } = req.query;
    const infoUser = await decodeToken(token);

    const user = await User.findById(infoUser.userId);
    if (!user) {
        return res.status(400).json({
            status: 'fail',
            statusCode: 400,
            message: 'Người dùng không tồn tại.'
        });
    } else {
        user.status = 'active';
        await user.save();


        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Email verified successfully.',
            user: user
        });
    }

    next();
}
);

// 404 Handler - Phải để cuối cùng
router.use(/(.*)/, (req, res, next) => {
    next();
});

export default router;