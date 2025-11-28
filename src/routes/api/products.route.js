import express from 'express';
import { createProductController, deleteProductController, getProducts, getProductsDetail, updateFullProductController, updateProductController } from '../../controllers/client/product.controller.js';


const router = express.Router();


// Lấy ra danh sách sản phẩm
router.get('/', getProducts);


// Lấy ra chi tiết sản phẩm
router.get('/', getProductsDetail);

// POST /api/v1/products - Tạo sản phẩm mới
router.post('/', createProductController);


// PUT /products/:id - Cập nhật toàn bộ thông tin sản phẩm
router.put('/', updateFullProductController);


// PATCH /products/:id - Cập nhật một phần thông tin sản phẩm
router.patch('/', updateProductController);



// Delete /products/:id - Xóa sản phẩm
router.delete('/', deleteProductController);



export default router;