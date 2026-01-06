

// Cấu trúc của 1 controller chuẩn

import { generateTokens } from "../../config/jwt.js";
import User from "../../models/User.js";

const register = async (req, res) => {
    try {
        // 1. Lấy dữ liệu từ req
        // req.body (dữ liệu từ post/put reqest), req.params (tham số từ url), req.query (query string), req.headers (HTTP headers)
        const { username, email, password = "", passwordComfirm = "" } = req.body;

        // 2 Validate dữ liệu
        // Nếu không hợp lệ -> trả về lỗi
        if (!email || !password || !username || !passwordComfirm) {

            return res.status(400).json({
                message: 'Vui lòng điền đầy đủ thông tin'
            })
        }

        if (password !== passwordComfirm) {
            throw new Error('Mật khẩu và xác nhận mật khẩu không khớp.');
        }


        // Kiểm tra email đã tồn tại hay chưa
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            throw new Error('Email đã được sử dụng bởi người dùng khác.');
        }


        console.log('Register data:', { username, email, password });

        // 3: Tạo user mới
        const newUser = await User.create({ username, email, password, passwordComfirm, role: 'user', status: 'active' });

        console.log('New user created:', newUser);

        // Tạo JWT Tokens
        const { accessToken, refreshToken } = generateTokens(newUser);
        console.log('Generated Tokens:', { accessToken, refreshToken });

        // 4. Trả về response thành công hoặc thất bại

        res.status(201).json({
            status: 'success',
            statusCode: 201,
            message: 'Đăng Kí Thành Công',
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status,
            },
            tokens: {
                accessToken,
                refreshToken
            }
        })


    } catch (error) {
        // Xử lý lỗi
        console.error('Error during user registration:', error);
        return res.status(500).json({
            message: error.message
        });
    }
}

const login = (req, res) => {
    res.send('Register endpoint');
}

const logout = (req, res) => {
    res.send('Register endpoint');
}

const getLoginPage = (req, res) => {
    res.send('Trang đăng nhập người dùng');
}
const getRegisterPage = (req, res) => {
    res.send('Trang đăng kí người dùng');
}
const getLogoutPage = (req, res) => {
    res.send('Trang đăng xuất người dùng');
}


export { register, login, logout, getLoginPage, getRegisterPage, getLogoutPage };