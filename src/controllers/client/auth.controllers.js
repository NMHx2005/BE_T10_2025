

// Cấu trúc của 1 controller chuẩn

import { generateTokens } from "../../config/jwt.js";
import User from "../../models/User.js";
import { sendVerificationEmail } from "../../services/email/email.service.js";
import { comparePassword, hashPassword } from "../../utils/password.js";

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
        const hashedPassword = await hashPassword(password);
        // 3: Tạo user mới
        const newUser = await User.create({ username, email, password: hashedPassword, passwordComfirm: hashedPassword, role: 'user', status: 'inactive' });

        // Tạo JWT Tokens
        const { accessToken, refreshToken } = generateTokens(newUser);


        // Gửi email xác thực
        try {
            await sendVerificationEmail(newUser.email, accessToken);
        } catch (emailError) {
            console.error('Lỗi gửi email xác thực:', emailError);
        }

        // 4. Trả về response thành công hoặc thất bại, nếu thành công thì vui lòng xác thực email

        res.status(201).json({
            status: 'success',
            statusCode: 201,
            message: 'Đăng Kí Thành Công, nhưng chưa kích hoạt tài khoản, vui lòng kiểm tra email để xác thực tài khoản.',
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

const login = async (req, res) => {
    // B1: Lấy dữ liệu từ req
    const { email, password } = req.body;

    // B2: Tìm user trong db
    const user = await User.findOne({ email: email }).select('+password');

    // B3: Kiếm tra user có tồn tại hay không
    if (!user) {
        throw new UnauthorizedError('Email hoặc mật khẩu không đúng.');
    }

    // B4: Kiểm tra user có bị khóa hay không
    if (user.status === 'inactive') {
        throw new UnauthorizedError('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực tài khoản.');
    }

    // B5: So sánh password
    const isPasswordCorrect = await comparePassword(password, user.password);


    if (!isPasswordCorrect) {
        throw new UnauthorizedError('Email hoặc mật khẩu không đúng.');
    }

    // B6: Tạo JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // B7: Cập nhật thông tin đăng nhập

    // B8: reset login attempts
    // Cơ chế đếm số lần đăng nhập sai


    // B9: response
    res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Đăng nhập thành công.',
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status
        },
        tokens: {
            accessToken,
            refreshToken
        }
    });
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