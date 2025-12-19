import express from 'express';

// Import route modules
import apiRoutes from './api/index.js';
import webRoutes from './web/index.js';


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

// 404 Handler - Phải để cuối cùng
router.use(/(.*)/, (req, res, next) => {
    next();
});

export default router;