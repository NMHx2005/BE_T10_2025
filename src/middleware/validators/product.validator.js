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


export const createProductValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên sản phẩm không được để trống.')
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên sản phẩm phải có ít nhất 2 ký tự và không quá 100 ký tự.'),
    body('description')
        .optional(),
    body('price')
        .notEmpty()
        .withMessage('Giá sản phẩm không được để trống.')
        .isFloat({ min: 0 })
        .withMessage('Giá sản phẩm phải >= 0'),
    body('category')
        .notEmpty()
        .withMessage('Danh mục sản phẩm không được để trống.')
        .isMongoId()
        .withMessage('Danh mục sản phẩm không hợp lệ.'),
    body('brand')
        .optional()
        .isMongoId()
        .withMessage('Thương hiệu sản phẩm không hợp lệ.'),
    body('stock')
        .optional(),

    body('variants')
        .optional()
        .isArray()
        .withMessage('Variants phải là một mảng.'),
    validate
];