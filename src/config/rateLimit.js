import rateLimit from 'express-rate-limit';

// rate limiter chung cho tất cả requests
export const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 phút
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUEST) || 100, // giới hạn mỗi IP
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.', // thông điệp khi vượt quá giới hạn
    standardHeaders: true, // gửi thông tin rate limit trong headers `RateLimit-*`
    legacyHeaders: false, // không gửi thông tin rate limit trong headers `X-RateLimit-*`
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true', // không tính các request thành công vào giới hạn
    handler: (req, res) => {
        res.status(429).json({ message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.' });
    }
});


// rate limiter nghiêm ngặt cho authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 20, // giới hạn mỗi IP
    message: 'Quá nhiều yêu cầu xác thực từ IP này, vui lòng thử lại sau.', // thông điệp khi vượt quá giới hạn
    standardHeaders: true, // gửi thông tin rate limit trong headers `RateLimit-*`
    legacyHeaders: false, // không gửi thông tin rate limit trong headers `X-RateLimit-*`
    skipSuccessfulRequests: true, // tính cả các request thành công vào giới hạn
});


// rate limiter cho API endpoints
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 500, // giới hạn mỗi IP
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.', // thông điệp khi vượt quá giới hạn
    standardHeaders: true, // gửi thông tin rate limit trong headers `RateLimit-*`
    legacyHeaders: false, // không gửi thông tin rate limit trong headers `X-RateLimit-*`
});



// rate limiter cho file upload
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 phút
    max: 50, // giới hạn mỗi IP
    message: 'Quá nhiều yêu cầu tải lên từ IP này, vui lòng thử lại sau.', // thông điệp khi vượt quá giới hạn
    standardHeaders: true, // gửi thông tin rate limit trong headers `RateLimit-*`
    legacyHeaders: false, // không gửi thông tin rate limit trong headers `X-RateLimit-*`
});