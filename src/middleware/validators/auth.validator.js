import { body, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
    // lấy tất cả lỗi từ validation
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // format lỗi trả về client
        const formattedErrors = errors.array().map(error => ({
            message: error.msg
        }));

        return res.status(400).json({
            errors: formattedErrors,
            success: false,
            message: 'Dữ liệu không hợp lệ.'
        })
    }


    next();

}

export const registerValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Tên người dùng không được để trống.')
        .isLength({ min: 2, max: 30 })
        .withMessage('Tên người dùng phải có ít nhất 2 ký tự và không quá 30 ký tự.'),

    body('email')
        .trim()
        .notEmpty()
        .isEmail()
        .withMessage('Vui lòng nhập email hợp lệ.'),

    body('password')
        .notEmpty()
        .withMessage('Mật khẩu không được để trống.')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự.'),

    body('passwordComfirm')
        .notEmpty()
        .withMessage('Xác nhận mật khẩu không được để trống.')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Mật khẩu xác nhận không khớp.');
            }
            return true;
        }),

    validate
];

export const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email không được để trống.')
        .isEmail()
        .withMessage('Vui lòng nhập email hợp lệ.')




    , body('password')
        .notEmpty()
        .withMessage('Mật khẩu không được để trống.'),


    validate
];