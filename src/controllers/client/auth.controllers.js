

// Cấu trúc của 1 controller chuẩn

import { decodeToken, generateAccessToken, generateRefreshToken, generateTokens, getTokenExpiration, getTokenFromRequest, verifyAccessToken, verifyRefreshToken } from "../../config/jwt.js";
import RefreshToken from "../../models/RefreshToken.js";
import TokenBlacklist from "../../models/TokenBlacklist.js";
import User from "../../models/User.js";
import { sendVerificationEmail } from "../../services/email/email.service.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { UnauthorizedError } from "../../utils/errors.js";
import dotenv from 'dotenv';

dotenv.config();

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


    // Dùng cho khi phát triển sockeio realtime
    // B7: Cập nhật thông tin đăng nhập
    // user.lastLogin = new Date();


    // B8: reset login attempts
    // Cơ chế đếm số lần đăng nhập sai
    // Reset về 0 nếu đăng nhập thành công
    // if (user.loginAttempts > 0) {
    //     await user.resetLoginAttempts();
    // }
    let decoded = verifyRefreshToken(refreshToken);
    await RefreshToken.createToken(refreshToken, user.id, decoded.exp);


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


// 4: logout controller

// c1: Client-side logout: Đơn giản, ít an toàn

// c2: token blacklist: phổ biến, cân bằng
// server lưu danh sách token đã logout
// mỗi request gửi đến, đều phải kiểm tra tokent có trong blacklist không
// nếu có => reject request
// token vẫn hiệu lực => nhưng bị chặn

// c3: refresh token rotation: an toàn nhất, phức tạp
// logout => revoke refresh token
// access token vẫn còn hiệu lực nhưng không thể refresh được nữa
// Sau khi access token hết hạn => Không dùng được nữa

// c4: short-lived tokens: đơn giản, ít an toàn
const logout = async (req, res, next) => {
    try {
        const accessToken = getTokenFromRequest(req);

        if (!accessToken) {
            return res.status(200).json({
                success: true,
                message: 'Đăng xuất thành công'
            })
        }

        let decoded;
        let tokenExpiresAt;

        try {
            decoded = verifyAccessToken(accessToken);
            if (decoded.exp) {
                tokenExpiresAt = new Date(decoded.exp * 1000);
            }
        } catch (error) {
            const decodeExpired = decodeToken(accessToken);
            if (decodeExpired && decodeToken.exp) {
                decoded = decodedExpired;
                tokenExpiresAt = new Date(decodedExpired.exp * 1000);
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'Đăng xuất thành công'
                })
            }
        }

        if (decoded && decoded.userId && tokenExpiresAt) {
            try {
                console.log("Đã lưu vào blacklist")
                await TokenBlacklist.addToBlackList(
                    accessToken,
                    'access',
                    decoded.userId,
                    tokenExpiresAt,
                    'logout'
                )
            } catch (error) {

            }
        }
        // const { refreshToken = "" } = req.body;
        // if (refreshToken !== "" && decoded && decoded.userId) {
        //     try {
        //         const isValidRefreshToken = await RefreshToken.isValidToken(refreshToken);
        //         if (isValidRefreshToken) {
        //             await RefreshToken.revokeToken(refreshToken, 'logout');

        //             try {
        //                 const refreshDecoded = verifyRefreshToken(refreshToken);
        //                 if (refreshDecoded.exp) {
        //                     await TokenBlacklist.addToBlackList(
        //                         refreshToken,
        //                         'refresh',
        //                         decoded.userId,
        //                         new Date(refreshDecoded.exp * 1000),
        //                         'logout'
        //                     )
        //                 }
        //             } catch (error) {

        //             }
        //         }
        //     } catch (error) {
        //         console.error('Lỗi khi revore refresh token + không ảnh hưởng logout');
        //     }
        // }


        return res.status(200).json({
            success: true,
            message: "Đăng xuất thành công"
        })
    } catch (error) {
        next(error);
    }

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


const refreshToken = async (req, res, next) => {
    try {
        // B1: Lấy refresh token từ request body
        const { refreshToken: refreshTokenString } = req.body;

        if (!refreshTokenString) {
            throw new UnauthorizedError('Refresh Token là bắt buộc')
        }

        // B2: Verify refresh token
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshTokenString);
            // console.log(decoded);
            // decoded sẽ có dạng
            // {
            //     userId: '695f565f01fec25545353898',
            //         iat: 1768827434,
            //             exp: 1771419434
            // }
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Refresh token đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedError('Refresh token không hợp lệ');
            } else {
                throw error;
            }
        }

        // B3: Kiểm tra refresh token trong database
        // const tokenDoc = await RefreshToken.findByToken(refreshTokenString);

        // if (!tokenDoc) {
        //     throw new UnauthorizedError('Refresh token không tồn tại. Vui lòng đăng nhập lại');
        // }

        // B4: Tìm user
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new UnauthorizedError('User không tồn tại');
        }

        // Kiểm tra use còn active hay không
        if (user.status !== 'active') {
            throw new UnauthorizedError('Tài khoản của bạn đã bị vô hiệu hóa');
        }

        // B5: Tạo access token mới
        const newAccessToken = generateAccessToken(user);
        const newRefresherToken = generateRefreshToken(user);

        const newRefresherTokenExpiresAt = getTokenExpiration(newRefresherToken);

        await RefreshToken.createToken(
            newRefresherToken,
            user.id,
            newRefresherTokenExpiresAt,
        );

        await RefreshToken.revokeToken(refreshTokenString, 'token_totation');


        res.status(200).json({
            success: true,
            message: "Làm mới token thành công",
            data: {
                user: user,
                tokens: {
                    accessToken: newAccessToken,
                    refreshToken: newRefresherToken
                }
            }
        })
    } catch (error) {
        next(error);
    }
}
// B1: lấy refresh
// B2: decoded
// B3: Tìm user. Tạo refresh token mới
// Trả về
export { register, login, logout, getLoginPage, getRegisterPage, getLogoutPage, refreshToken };