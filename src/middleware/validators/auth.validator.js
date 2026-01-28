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


export const updateProfileValidation = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage("Username phải có từ 3 - 30 kí tự")


    // phone và avatar
];


/**
 * ADDRESS VALIDATION
 * Validation rules cho địa chỉ
 */
export const addressValidation = [
    body('fullName')
        .notEmpty()
        .withMessage('Tên người nhận là bắt buộc')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Tên người nhận phải có từ 2 đến 50 ký tự'),

    body('phone')
        .notEmpty()
        .withMessage('Số điện thoại là bắt buộc')
        .trim()
        .matches(/^(0|\+84)[0-9]{9,10}$/)
        .withMessage('Số điện thoại không hợp lệ'),

    body('address')
        .notEmpty()
        .withMessage('Địa chỉ là bắt buộc')
        .trim(),

    body('ward')
        .notEmpty()
        .withMessage('Phường/Xã là bắt buộc')
        .trim(),

    body('district')
        .notEmpty()
        .withMessage('Quận/Huyện là bắt buộc')
        .trim(),

    body('city')
        .notEmpty()
        .withMessage('Tỉnh/Thành phố là bắt buộc')
        .trim(),

    body('isDefault')
        .optional()
        .isBoolean()
        .withMessage('isDefault phải là boolean'),

    body('note')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Ghi chú không được quá 200 ký tự'),

    validate
];