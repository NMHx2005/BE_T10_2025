import AppError from "./AppError.js";



// Validation Error - Lỗi xác thực dữ liệu
// Sử dụng khi dữ liệu không hợp lệ
export class ValidationError extends AppError {
    constructor(message = "Dữ liệu không hợp lệ", error = []) {
        super(message, 400, 'fail');
    }
}



// Not found error = không tìm thấy resource
// Sử dụng khi tìm kiếm nhưng không tìm thấy (404)
export class NotFoundError extends AppError {
    constructor(message = "Không tìm thấy tài nguyên yêu cầu") {
        super(message, 404, 'fail');
    }
}




// Unauthorized error - Lỗi chưa xác thực
// Sử dụng khi user chưa đăng nhập (401)





// Forbidden error - Lỗi không có quyền truy cập
// Sử dụng khi user không có quyền truy cập resource - ví dụ: user thường truy cập trang admin (403)




// conflic error - Lỗi xung đột
// Sử dụng khi có xung đột dữ liệu (409)
export class ConflictError extends AppError {
    constructor(message = "Xung đột dữ liệu") {
        super(message, 409, 'fail');
    }
}





// Database error - Lỗi database
// Sử dụng khi có lỗi từ database (500)
export class DatabaseError extends AppError {
    constructor(message = "Lỗi database", originalError = null) {
        super(message, 500, 'error');
        this.originalError = originalError; // Lưu lại lỗi gốc từ database
    }
}


export { AppError };