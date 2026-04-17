import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();


// Tạo email transporter: Cấu hình để gửi email
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    })
}


// Gửi email xác thực
export const sendVerificationEmail = async (email, token) => {
    try {
        const transporter = createTransporter();

        // URL xác thực (frontend url + token)
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

        // Nội dung email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Xác thực địa chỉ email của bạn",
            html: `
                <h2>Chào mừng bạn đến với hệ thống!</h2>
                <p>Cảm ơn bạn đã đăng kí tài khoản.</p>
                <p>Vui lòng click vào link bên dưới để xác thực email:</p>
                <a href="${verificationUrl}">Xác thực email</a>
            `
        };


        // gửi email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.messageId);

        return info;

    } catch (error) {
        console.error('Lỗi gửi email xác thực:', error);
        throw error;
    }

}


export const sendPasswordResetEmail = async (email, token) => {
    const transporter = createTransporter();
    const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password/${encodeURIComponent(token)}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Đặt lại mật khẩu — PRO-TOOLS',
        html: `
                <h2>Đặt lại mật khẩu</h2>
                <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản này.</p>
                <p><a href="${resetUrl}">Nhấn vào đây để đặt mật khẩu mới</a> (hiệu lực 1 giờ).</p>
                <p>Nếu không phải bạn, bỏ qua email này.</p>
            `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent: ' + info.messageId);
    return info;
};

export default {
    sendVerificationEmail,
    sendPasswordResetEmail,
}




