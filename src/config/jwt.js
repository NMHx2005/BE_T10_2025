// JWT là gì: JSON Web Token là một chuỗi kí tự được mã hóa để xác thực người dùng
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
// Tại sao nên dùng JWT:
// stateless: server không cần lưu session
// scale: dễ mở rộng hệ thống
// sell-contaned: chứa thông tin cần thiết



// Cách JWT hoạt động:
// User gguiwr username/password - Server
// Server verify credentials
// Server tạo JWT token (chưa userID, email, role, ....)
// Server trả về JWT cho client
// Client lưu JWT (localStorage, sessionStorage, cookie,...)



// Flow request hoạt động
// Client gửi request kèm JWT trong Header Authorization: Bearer jsndfnseuifiuwsneiuofnwioenrwe....
// Server nhận JWT
// Server verify JWT (kiểm tra tính hợp lệ, hết hạn,...)
// Nếu hợp lệ -> extract thông tin user từ JWT
// Serber tiếp tục xử lý request



import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


// JWT Secret key: Đây là key bí mật để ký và verify token
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-here";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh";


// JWT Expiration time: Thời gian hết hạn của token
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d"; // 7 days
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || "30d"; // 30 days


// JWT ALGORITHM: Thuật toán mã hóa token
// HS256: HMAC SHA256 - Đơn giản, phổ biến
// RS256: RSA SHA256 - Phức tạp hơn, mạnh hơn
// ES256: ECDSA SHA256 = Mạnh, nhanh

const JWT_ALGORITHM = process.env.JWT_ALGORITHM || "HS256";


// generate token - tạo jwt token

/**
 * SIGN TOKEN - Tạo và ký JWT token
 * 
 * @param {Object} payload - Dữ liệu cần lưu trong token (userID, email, role,...)
 * @param {String} expiresIn - Thời gian hết hạn của token (vd: '7d' - 7 ngày)
 * @param {String} secret - Khóa bí mật để ký token
 * @returns {String} - Trả về JWT token đã ký
 * 
 */
const signToken = (payload, expiresIn, secret) => {
    return jwt.sign(
        payload,
        secret,
        {
            expiresIn: expiresIn,
            algorithm: JWT_ALGORITHM
        }
    )
}


/**
 * generate access token - Tạo access token
 * @param {Object} user - Thông tin user
 * @return {String} - Trả về access token
 * 
 */

export const generateAccessToken = (user) => {
    // payload chứa thông tin user
    // Chỉ đưa thông tin cần thiết và token
    const payload = {
        userId: user._id || user.id,
        email: user.email,
        role: user.role || 'user'
    };

    // Tạo và trả về token
    return signToken(payload, JWT_EXPIRE, JWT_SECRET);

}



/**
 * generate refresh token - Tạo refresh token
 * @param {Object} user - Thông tin user
 * @return {String} - Trả về refresh token
 */


export const generateRefreshToken = (user) => {
    const payload = {
        userId: user._id || user.id,
    }

    return signToken(payload, JWT_REFRESH_EXPIRE, JWT_REFRESH_SECRET);
}


export const generateTokens = (user) => {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user)
    }
}


// Xác thực JWT token
const verifyToken = (token, secret) => {
    return jwt.verify(token, secret, {
        algorithms: [JWT_ALGORITHM]
    });
}

// Xác thực access token
export const verifyAccessToken = (token) => {
    return verifyToken(token, JWT_SECRET);
}

// xác thực refresh token
export const verifyRefreshToken = (token) => {
    return verifyToken(token, JWT_REFRESH_SECRET);
}
// Decode token không verify
export const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
}

// Lấy token từ request

export const getTokenFromRequest = (req) => {
    // Bearer jbsebswjebrowe
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return null;
    }

    // Tách "Bearer" và token
    const parts = authHeader.split(' ');

    // kiểm tra format
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];


}


export const getTokenExpiration = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) {
            return new Date(decoded.exp * 1000); // Chuyển đổi từ giây sang milliseconds
        }
        return null;
    } catch (error) {
        return null;
    }
}

export default {
    JWT_SECRET,
    JWT_EXPIRE,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRE,
    JWT_ALGORITHM,
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken,
    getTokenFromRequest,
    getTokenExpiration
}