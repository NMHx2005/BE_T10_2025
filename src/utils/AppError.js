// Kế thừa từ lớp lỗi mặc định  rồi tùy chỉnh cho ứng dụng
class AppError extends Error {
    /**
     * Constructor - Hàm khởi tạo
     * 
     * @param {String} message - Thông báo lỗi
     * @param {Number} statusCode - HTTP status code (400, 404, 500...)
     * @param {String} status - Trạng thái ('fail' hoặc 'error')
     * @param {Boolean} isOperational - Đây có phải lỗi được xử lý (operational error) không?
     */

    constructor(message, statusCode, status = 'error', isOperational = true) {
        // Gọi constructor của class cha (Error)
        super(message);

        this.statusCode = statusCode;
        this.status = status;
        this.isOperational = isOperational;


        // Stack trace - dòng code gây ra lỗi
        // captureStackTrace - để không hiển thị dòng này trong stack trace
        Error.captureStackTrace(this, this.constructor);

        // Tên của class (AppError)
        this.name = this.constructor.name;
    }

}

export default AppError;


// Giải thích: Mỗi class kế thừa AppError và đặt status code phù hợp
// Dễ xử lý lỗi theo từng loại và trả về mã HTTP đúng chuẩn