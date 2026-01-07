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
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

        // Nội dung email
        const mailOptions = {
            form: process.env.EMAIL_USER,
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


export default {
    sendVerificationEmail
}




