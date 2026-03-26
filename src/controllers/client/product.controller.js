import { NotFoundError } from "../../utils/errors.js";
import Product from "../../models/Product.js"

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

const toNumber = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}
const buildSort = (sort) => {
    const sortMap = {
        newest: { createAt: -1 },
        oldest: { createAt: 1 },
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        name_asc: { name: 1 },
        name_desc: { name: -1 },
    }

    return sortMap[sort] || { createAt: -1 };
}
const getProducts = async (req, res, next) => {
    try {
        // 1. parse pagination
        const page = Math.max(toNumber(req.query.page, 1), 1);
        const limit = Math.min(Math.max(toNumber(req.query.limit, 10), 1), 100);
        const skip = (page - 1) * limit;


        // 2. build filter object
        const filter = {
            deleted: { $ne: true }, // Nếu model soft delete
        }

        // Filter category/brand
        if (req.query.category) filter.category = req.query.category;
        if (req.query.brand) filter.brand = req.query.brand;

        // Filter price range
        const minPrice = toNumber(req.query.mỉnPrice, null);
        const maxPrice = toNumber(req.query.maxPrice, null);

        // Search theo name/description (case - insensitive)
        if (req.query.search) {
            const keyword = req.query.search.trim();
            filter.$or = [
                { name: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
            ];
        }

        // 3. Build sort
        const sort = buildSort(req.query.sort);

        // 4. Query: list + total
        const products = await Product.find(filter)
            .populate("category", "name slug")
            .populate("brand", "name slug")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean()

        const totalItems = await Product.countDocuments(filter);


        // 5. pagination metedata
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách sản phẩm thành công',
            data: products,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            filters: {
                category: req.query.category || null,
                brand: req.query.brand || null,
                minPrice,
                maxPrice,
                search: req.query.search || null,
                sort: req.query.sort || "newest",
            }
        })



    } catch (error) {
        next(error);
    }
}


const getProductsDetail = (req, res) => {
    res.send('Chi tiết sản phẩm');
}

export { createProductController, updateFullProductController, updateProductController, deleteProductController, getProducts, getProductsDetail };