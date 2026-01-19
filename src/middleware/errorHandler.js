// Hàm xử lý lỗi chung
// Error Handling Middleware đặc biệt như thế nào ?
// Thông thường thì sẽ có 3 tham số: (req, res, next)
import AppError from "../utils/AppError.js";
import { ValidationError } from "../utils/errors.js";

// Xử lý lỗi Development
// Trả về lỗi chi tiết
/**
 * 
 * 
 * 
 * @param {Error} err - Lỗi xảy ra
 * @param {Object} req - Request object
 * @param {Object} res - response object
 */
const sendErrorDev = (err, req, res) => {
    // Trả về toàn bộ thông tin lỗi trong dev
    res.status(err.statusCode || 500).json({
        success: false,
        status: err.status || 'error',
        message: err.message,
        error: err, // Toàn bộ object lỗi
        stack: err.stack // Stack trace để debug
    })
}

// Xử lý lỗi production
// Chỉ trả về thông tin cần thiết, không tiết lộ chi tiết
/**
 * 
 * 
 * 
 * @param {Error} err - Lỗi xảy ra
 * @param {Object} req - Request object
 * @param {Object} res - response object
 */

const sendErrorProd = (err, req, res) => {
    // Nếu là operational error (lỗi được xử lý)
    if (err.isOperational) {
        // trả về thông báo lỗi an toàn
        res.status(err.statusCode || 500).json({
            success: false,
            status: err.status || 'error',
            message: err.message
        })
    } else {
        // Nếu là programming error (lỗi code)
        // Không tiết lộ chi tiết cho client
        console.error("ERROR >>> ", err);
        res.status(500).json({
            success: false,
            status: 'error',
            message: "Có lỗi xảy ra, vui lòng thử lại sau"
        })
    }
}


/**
 * XỬ LÝ LỖI VALIDATION TỪ EXPRESS-VALIDATOR
 * Express-validator trả về lỗi dạng { errors: [...] }
 * 
 * @param {Error} err - Lỗi validation
 * @returns {AppError} - ValidationError đã được format
 */
const handleValidationError = (err) => {
    // kiểm tra nếu có errors array từ express-validator
    if (err.errors && Array.isArray(err.errors)) {
        const message = err.errors.map(e => e.msg || e.message).join(', ');
        return new ValidationError(`Validation failed: ${message}`, err.errors);
    }
    return null;
}

/**
 * XỬ LÝ LỖI MONGOOSE (DATABASE)
 * 
 * @param {Error} err - Lỗi từ Mongoose
 * @returns {AppError} - AppError đã được format
 */
const handleMongooseError = (err) => {
    let error = { ...err };
    error.message = err.message;

    // Lỗi duplicate key (ví dụ: email đã tồn tại)
    if (err.code === 11000) {
        // Lấy field bị duplicate
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];

        const message = `${field} "${value}" đã tồn tại. Vui lòng sử dụng giá trị khác.`;
        error = new AppError(message, 409); // 409 Conflict
    }

    // Lỗi validation của Mongoose
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        error = new ValidationError('Dữ liệu không hợp lệ', errors);
    }

    // Lỗi Cast Error (ví dụ: ID không hợp lệ)
    if (err.name === 'CastError') {
        const message = `Giá trị "${err.value}" không hợp lệ cho ${err.path}`;
        error = new AppError(message, 400);
    }

    return error;
};


// JWT
// JWT Expired
/**
 * XỬ LÝ LỖI JWT
 * 
 * @param {Error} err - Lỗi từ JWT
 * @returns {AppError} - AppError đã được format
 */
const handleJWTError = () => {
    return new AppError('Token không hợp lệ. Vui lòng đăng nhập lại.', 401);
};

/**
 * XỬ LÝ LỖI JWT EXPIRED
 * 
 * @returns {AppError} - AppError đã được format
 */
const handleJWTExpiredError = () => {
    return new AppError('Token đã hết hạn. Vui lòng đăng nhập lại.', 401);
};


/**
 * Error handler middleware chính - phiên bản đầy đủ
 */
// Error handler middleware chính
// middleware này phải có 4 tham số (err, req, res, next)
// Express sẽ tự động nhận biết đây là error handler middleware
/**
 * 
 * 
 * 
 * @param {Error} err - Lỗi xảy ra
 * @param {Object} req - Request object
 * @param {Object} res - response object
 * @param {Function} next - Next Middleware function
*/
const errorHandler = (err, req, res, next) => {
    // Gán statusCode mặc định nếu chưa có
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';


    let error = { ...err };
    error.message = err.message;

    // xử lý các loại lỗi cụ thể

    //1.Lỗi validation
    const validationError = handleValidationError(err);
    if (validationError) {
        error = validationError;
    }

    // 2.Lỗi database (mongoose)
    if (err.name === 'MongoError' || err.name === 'MongooseError' || err.name === 'ValidationError' || err.name === 'CastError') {
        error = handleMongooseError(err);
    }


    // 3. Lỗi JWT
    if (err.name === "JsonWebTokenError") {
        error = handleJWTError();
    }



    // 4. Lỗi JWT Expired
    if (err.name === "TokenExpiredError") {
        error = handleJWTExpiredError();
    }



    // Kiểm tra môi trường (dev || prod) 
    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, req, res);
    } else {
        sendErrorProd(err, req, res);
    }
}







export default errorHandler;

