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
        .trim()
        .isLength({ max: 120 })
        .withMessage('Tên thương hiệu không quá 120 ký tự.'),
    body('stock')
        .optional(),

    body('variants')
        .optional()
        .isArray()
        .withMessage('Variants phải là một mảng.'),
    validate
];

export const updateProductValidation = [
    // Validate data (optional vì partial update)
    body("name")
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage("Tên sản phẩm từ 3 đến 200 ký tự"),
    body("description")
        .optional()
        .isLength({ max: 2000 })
        .withMessage("Mô tả không quá 2000 ký tự"),
    body("price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Giá phải >= 0"),
    body("stock")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Stock phải là số nguyên >= 0"),
    body("category")
        .optional()
        .isMongoId()
        .withMessage("Category ID không hợp lệ"),
    body("brand")
        .optional()
        .trim()
        .isLength({ max: 120 })
        .withMessage("Tên thương hiệu không quá 120 ký tự"),
    body("variants")
        .optional()
        .isArray()
        .withMessage("Variants phải là mảng"),
    body("variants.*.name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Tên variant không được rỗng"),
    body("variants.*.price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Giá variant phải >= 0"),
    body("variants.*.stock")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Stock variant phải là số nguyên >= 0"),
    validate
]