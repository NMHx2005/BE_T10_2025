export const loginValidation = [
    body('email')
        .trim()
        .withMessage('Email không hợp lệ.')
        .notEmpty()
        .isEmail()
        .withMessage('Vui lòng nhập email hợp lệ.')




    , body('password')
        .notEmpty()
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự.'),
];