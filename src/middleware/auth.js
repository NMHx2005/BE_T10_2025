import { getTokenFromRequest, verifyAccessToken } from "../config/jwt.js";
// flow: request => middleware -> controller => response
// Phải kiểm tra auth trong mỗi controller
// Authentication middleware



// Bảo vệ route, yêu cầu đăng nhập
// explain: bắt buộc có token, verify và gắn user vào req
export const protect = async (req, res, next) => {
    try {
        // B1: Lấy token từ header
        const token = getTokenFromRequest(req);

        if (!token) {
            throw new UnauthorizedError('Bạn cần đăng nhập để truy cập tài nguyên này');
        }

        const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
        if (isBlacklisted) {
            throw new UnauthorizedError('Token đã bị thu hồi. Vui lòng đăng nhập lại.');
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
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            throw new UnauthorizedError('Người dùng không tồn tại');
        }


        // Kiểm tra user còn active hay không
        if (user.status !== 'active') {
            throw new UnauthorizedError(`
                Tài khoản của bạn đã bị ${user.status === 'inactive' ? "vô hiệu hóa" : "khóa"}. Vui lòng liên hệ admin.    
            `);
        }

        // Gắn user vào request để dùng ở các middleware/controller sau
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;

        // Cho phép request đi tiếp
        next();
    } catch (error) {
        next(error);
    }
}


// Giới hạn quyền truy cập theo role (403 Forbidden)
// Cách hoạt động: Higher-order function (Hàm trả về hàm)
// Nhận danh sách roles => trả về middleware function
// middleware function kiểm tra req.user.role
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


// admin only - chỉ admin mới được truy cập
export const adminOnly = restrictTo("admin");


// user only - chỉ user mới được truy cập (không phải admin)
export const userOnly = restrictTo("user");


// optional authentication middleware
// Ví dụ: trang public nhưng có thể hiển thị thêm nội dung nếu đã đăng nhập
// explain: xấc thực tùy chọn, không có token vẫn tiếp tục
export const optionalAuth = async (req, res, next) => {
    try {
        // Lấy token từ header
        const token = getTokenFromRequest(req);

        //Nếu không có token -> Vẫn tiếp tục (khổng throw error)
        if (!token) {
            req.user = null;
            req.userId = null;
            req.userRole = null;
            return next();
        }

        // Có token -> verify
        try {
            const decoded = verifyAccessToken(token);
            const user = await User.findById(decoded.userId).select('-password');

            // Nếu user tồn tại và active => gắn vào request
            if (user && user.status === "active") {
                req.user = user;
                req.userId = user._id;
                req.userRole = user.role;
            } else {
                req.user = null;
                req.userId = null;
                req.userRole = null;
            }
        } catch (error) {
            req.user = null;
            req.userId = null;
            req.userRole = null;
        }

        next();
    } catch (error) {
        // Nếu có lỗi không mong muốn => vẫn tiếp tục
        req.user = null;
        req.userId = null;
        req.userRole = null;
        next();
    }
}




// Permission system - Định nghĩa các permission trong hệ thống
export const PERMISSIONS = {
    // User

    USER_VIEW: "user.view",
    USER_CREATE: "user.create",
    USER_UPDATE: "user.update",
    USER_DELETE: "user.delete",
    // Product

    PRODUCT_VIEW: "product.view",
    PRODUCT_CREATE: "product.create",
    PRODUCT_UPDATE: "product.update",
    PRODUCT_DELETE: "product.delete",

    // Order
    ORDER_VIEW: "order.view",
    ORDER_CREATE: "order.create",
    ORDER_UPDATE: "order.update",
    ORDER_DELETE: "order.delete",


    // Category
    CATEGORY_VIEW: "category.view",
    CATEGORY_CREATE: "category.create",
    CATEGORY_UPDATE: "category.update",
    CATEGORY_DELETE: "category.delete",


}


const ROLE_PERMISSIONS = {
    // admin - có tất cả quyền
    admin: Object.values(PERMISSIONS),


    // user - chỉ có quyền cơ bản
    user: {
        PRODUCT_VIEW: PERMISSIONS.PRODUCT_VIEW,
        ORDER_VIEW: PERMISSIONS.ORDER_VIEW,
        ORDER_CREATE: PERMISSIONS.ORDER_CREATE,
        CATEGORY_VIEW: PERMISSIONS.CATEGORY_VIEW
    }
}


// check permission middleware
export const checkPermission = (useRole, permission) => {
    const rolePermission = ROLE_PERMISSIONS[useRole] || [];
    return rolePermission.includes(permission);
}


// require permission = middleware yeu cau permission cu the
export const requirePermission = (permission) => {
    return (req, res, next) => {
        // kiem tra xem user da dang nhap chua
        if (!req.user) {
            throw new UnauthorizedError("Ban can dang nhap de thuc hien hanh dong nay");
        }

        // Kiem tra permission
        const hasPermission = checkPermission(req.user.role, permission);

        if (!hasPermission) {
            throw new ForbiddenError(`Ban khong co quyen thuc hien hanh dong nay. Yeu cau permission: ${permission}`)
        }

        next();
    }
}


export const requireAnyPermission = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new UnauthorizedError("Ban can dang nhap de thuc hien hanh dong nay");
        }


        // Kiem tra user co it nhat 1 permission khong
        const hasAnyPermission = permissions.some(permission => checkPermission(req.user.role, permission));

        if (!hasAnyPermission) {
            throw new ForbiddenError(`Ban khong co quyen thuc hien hanh dong nay. Yeu cau mot trong cac permisions: ${permissions.join(", ")}}`)
        }

        next();
    }
}



export const requireAllPermissions = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new UnauthorizedError("Ban can dang nhap de thuc hien hanh dong nay");
        }

        // Kiem tra user có tất cả permissions không
        const hasAllPermissions = permissions.every(permission => checkPermission(req.user.role, permission));


        if (!hasAllPermissions) {
            throw new ForbiddenError(`ban khong du quyen`);
        }

        next();

    }
}



