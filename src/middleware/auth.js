import { getTokenFromRequest, verifyAccessToken } from "../config/jwt.js";

// Bảo vệ route, yêu cầu đăng nhập
export const protect = async (req, res, next) => {
    try {
        // B1: Lấy token từ header
        const token = getTokenFromRequest(req);

        if (!token) {
            throw new UnauthorizedError('Bạn cần đăng nhập để truy cập tài nguyên này');
        }

        // Verify token
        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            } else if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedError('Token không hợp lệ, vui lòng đăng nhập lại');
            } else {
                throw error;
            }
        }


        // Tìm user từ db: find(decoded.id)
        const user = await User.findById(decoded.userId);
        if (!user) {
            throw new UnauthorizedError('Người dùng không tồn tại');
        }


        // Kiểm tra user còn active hay không
        if (user.status !== 'active') {
            throw new UnauthorizedError('Tài khoản của bạn đã bị vô hiệu hóa');
        }

        // Gắn user vào request để dùng ở các middleware/controller sau
        req.user = user;
        req.userId = user._id;

        // Cho phép request đi tiếp
    } catch (error) {
        next(error);
    }
}


// Giới hạn quyền truy cập theo role
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new UnauthorizedError('Bạn cần đăng nhập để truy cập tài nguyên này');
        };

        if (!roles.includes(req.user.role)) {
            throw new UnauthorizedError('Bạn không có quyền truy cập tài nguyên này');
        };

        next();
    };
};