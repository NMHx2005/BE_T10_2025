// Xử lý các thao tác liên quan đến password của người dùng

import User from "../../models/User.js";
import { hashPassword, comparePassword } from "../../utils/password.js";



// Đổi mật khẩu
export const changePassword = async (req, res, next) => {
    try {
        // B1: Lấy dữ liệu từ request
        const { currentPassword, newPassword, newPasswordComfirm } = req.body;

        // B2: Validate inpot
        if (!currentPassword || !newPassword || !newPasswordComfirm) {
            throw new Error('Vui lòng cung cấp đầy đủ thông tin.');
        }

        if (newPassword !== newPasswordComfirm) {
            throw new Error('Mật khẩu mới và xác nhận mật khẩu không khớp.');
        }

        if (currentPassword === newPassword) {
            throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại.');
        }

        // B3: Lấy user và password (phải select password)
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            throw new Error('Người dùng không tồn tại.');
        }

        // B4: Kiểm tra mật khẩu hiện tại
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);

        if (!isCurrentPasswordValid) {
            throw new Error('Mật khẩu hiện tại không đúng.');
        }

        // B5: Hash mật khẩu mới
        const hashedNewPassword = await hashPassword(newPassword);

        // B6: Cập nhật mật khẩu mới
        user.password = hashedNewPassword;
        user.passwordChangedAt = Date.now();

        await user.save();

        // B7: Gửi phản hồi thành công
        res.status(200).json({
            message: 'Đổi mật khẩu thành công.'
        });
    } catch (error) {
        next(error);
    }
}



// Reset mật khẩu
export const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password, passwordConfirm } = req.body;

        // B1: Validate input
        if (!password || !passwordConfirm) {
            throw new Error('Vui lòng cung cấp đầy đủ thông tin.');
        }
        if (password !== passwordConfirm) {
            throw new Error('Mật khẩu và xác nhận mật khẩu không khớp.');
        }

        // verify reset token
        // giải mã token
        // lấy ra user
        // kiểm tra xem token có hợp lệ và có hết hạn k

        const hashedToken = await hashPassword(password);

        // B2: Cập nhật mật khẩu mới cho user

        // Lưu thông tin đã cập nhật

        res.status(200).json({
            message: 'Đặt lại mật khẩu thành công.'
        });
    } catch (error) {
        next(error);
    }
}





export default {
    changePassword,
    resetPassword
}

