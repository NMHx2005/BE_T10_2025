import { NotFoundError } from "../../utils/errors.js";

const createProductController = (req, res, next) => {
    // const product = req.body;
    // if (!product) {
    //     return next(new NotFoundError("Không tìm thấy sản phẩm"));
    // }
    console.log("Đã thêm mới sản phẩm");
    res.send('Create Product endpoint');
}

const updateFullProductController = (req, res) => {
    console.log("Đã thêm mới sản phẩm");
    res.send('Create Product endpoint');
}

const updateProductController = (req, res) => {
    console.log("Đã thêm mới sản phẩm");
    res.send('Create Product endpoint');
}

const deleteProductController = (req, res) => {
    console.log("Đã thêm mới sản phẩm");
    res.send('Create Product endpoint');
}


const getProducts = (req, res) => {
    res.send('Danh sách sản phẩm');
}


const getProductsDetail = (req, res) => {
    res.send('Chi tiết sản phẩm');
}

export { createProductController, updateFullProductController, updateProductController, deleteProductController, getProducts, getProductsDetail };