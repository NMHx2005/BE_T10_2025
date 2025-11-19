import rateLimit from 'express-rate-limit';

export const createRateLimiter = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 phút
        max: 100, // giới hạn mỗi IP
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.', // thông điệp khi vượt quá giới hạn
        standardHeaders: true, // gửi thông tin rate limit trong headers `RateLimit-*`
        legacyHeaders: false, // không gửi thông tin rate limit trong headers `X-RateLimit-*`
        ...options
    };

    return rateLimit(defaultOptions);
}


// rate limiter động dựa trên user role
export const dynamicRoleLimiter = (req, res, next) => {
    let maxRequests = 100; // mặc định

    // Admin có thể có limit cao hơn
    if (req.user && req.user.role === "admin") {
        maxRequests = 1000;
    }

    const limiter = createRateLimiter({
        max: maxRequests,
        keyGenerator: (req) => {
            return req.user ? req.user.id : req.ip; // sử dụng user ID nếu có, nếu không thì dùng IP 
        }
    });

    limiter(req, res, next);

}