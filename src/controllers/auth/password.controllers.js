// Xử lý các thao tác liên quan đến password của người dùng

import User from "../../models/User.js";
import { hashPassword } from "../../utils/password.js";
import { ValidationError, NotFoundError } from "../../utils/errors.js";
import { generatePasswordResetToken, verifyPasswordResetToken } from "../../config/jwt.js";
import { sendPasswordResetEmail } from "../../services/email/email.service.js";

// Đổi mật khẩu (đã đăng nhập)
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword, newPasswordComfirm } = req.body;

        if (!currentPassword || !newPassword || !newPasswordComfirm) {
            throw new Error('Vui lòng cung cấp đầy đủ thông tin.');
        }

        if (newPassword !== newPasswordComfirm) {
            throw new Error('Mật khẩu mới và xác nhận mật khẩu không khớp.');
        }

        if (currentPassword === newPassword) {
            throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại.');
        }

        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            throw new Error('Người dùng không tồn tại.');
        }

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);

        if (!isCurrentPasswordValid) {
            throw new Error('Mật khẩu hiện tại không đúng.');
        }

        const hashedNewPassword = await hashPassword(newPassword);

        user.password = hashedNewPassword;
        user.passwordComfirm = hashedNewPassword;
        await user.save();

        res.status(200).json({
            message: 'Đổi mật khẩu thành công.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
    try {
        const emailRaw = req.body?.email;
        const email = emailRaw ? String(emailRaw).trim().toLowerCase() : '';
        const safeMessage =
            'Nếu email đã đăng ký trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.';

        if (!email) {
            throw new ValidationError('Vui lòng nhập email.');
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ success: true, message: safeMessage });
        }

        const token = generatePasswordResetToken(user._id);
        try {
            await sendPasswordResetEmail(user.email, token);
        } catch (mailErr) {
            console.error('sendPasswordResetEmail:', mailErr);
            throw new ValidationError(
                'Không gửi được email. Kiểm tra cấu hình EMAIL_USER / EMAIL_PASSWORD trong .env.'
            );
        }

        return res.status(200).json({ success: true, message: safeMessage });
    } catch (error) {
        next(error);
    }
};

// Reset mật khẩu qua link email
export const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password, passwordConfirm } = req.body;

        if (!password || !passwordConfirm) {
            throw new ValidationError('Vui lòng nhập đầy đủ mật khẩu và xác nhận.');
        }
        if (password !== passwordConfirm) {
            throw new ValidationError('Mật khẩu và xác nhận mật khẩu không khớp.');
        }
        if (password.length < 6) {
            throw new ValidationError('Mật khẩu phải có ít nhất 6 ký tự.');
        }

        let payload;
        try {
            payload = verifyPasswordResetToken(token);
        } catch {
            throw new ValidationError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        }

        const user = await User.findById(payload.userId).select('+password');
        if (!user) {
            throw new NotFoundError('Tài khoản không tồn tại.');
        }

        const hashed = await hashPassword(password);
        user.password = hashed;
        user.passwordComfirm = hashed;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Đặt lại mật khẩu thành công.'
        });
    } catch (error) {
        next(error);
    }
};

export default {
    changePassword,
    forgotPassword,
    resetPassword
};
