import helmet from 'helmet';

const helmetConfig = helmet({
    // Content Security Policy
    // Ngăn chặn các cuộc tấn công XSS và các cuộc tấn công code injection khác: Chỉ cho phép scripts từ nguồn tin cậy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.tailwindcss.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"
            ],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'", // Cần cho Tailwind CDN
                "https://cdn.tailwindcss.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "http://res.cloudinary.com",
                "https://res.cloudinary.com",
                "https://images.unsplash.com"
            ],
            fontSrc: [
                "'self'",
                "https://cdnjs.cloudflare.com"
            ],
            connectSrc: [
                "'self'",
                "https://api.cloudinary.com"
            ]
        }
    },

    // X-Content-Type-Options: Ngăn MINE type sniffing
    noSniff: true,

    // X-Frame-Options: Ngăn clickjacking: ngăn trang web của bạn bị nhúng trong iframe
    frameguard: { action: 'deny' },

    // X-XSS-Protection: XSS protection
    xssFilter: true,

    // Strict Transport Security (HSTS) - chỉ trong production 
    hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000, // 1 năm
        includeSubDomains: true,
        preload: true
    } : false,

    // X-Powered-By: ẩn thông tin server
    hidePoweredBy: true,

    // Referrer Policy
    referrerPolicy: {
        policy: "no-referrer-when-downgrade"
    }


});

export default helmetConfig;