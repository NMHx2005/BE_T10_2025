import cors from 'cors';


// Parse allowed origins từ evn variable
const getAllowedOrigins = () => {
    if (process.env.ALLOWED_ORIGINS) {
        return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    }

    // Mặc định nếu không có biến môi trường
    return [
        'http://localhost:3000',
        'http://localhost:4000'
    ]
}


// Cấu hình cors
const corsOptions = {
    // CHo phép các origin truy cập
    origin: function (origin, callback) {
        // Trong dev, cho phép requests không có origin (như Postman hoặc curl)
        if (!origin && process.env.NODE_ENV === "development") {
            return callback(null, true);
        }

        const allowedOrigins = getAllowedOrigins();

        // Kiểm tra origin có trong danh sách cho phép không
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }

    },


    // Các HTTP methods được phép
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    // Các headers được phép
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],

    // Có cho phép credentials (cookies, authorization headers, TLS client certificates) không
    credentials: true,

    // Thời gian preflight request được cache (tính bằng giây)
    maxAge: 86400, // 24 giờ

};

const corsConfig = cors(corsOptions);


export default corsConfig;