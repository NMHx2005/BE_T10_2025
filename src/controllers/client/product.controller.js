import { NotFoundError } from "../../utils/errors.js";
import Product from "../../models/Product.js"
import mongoose from "mongoose";
import slugify from "slugify";


const addRandomSuffix = (sku, length = 4) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < length; i++) {
        suffix += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return suffix;
};

const generateProductSKU = () => {
    return `PRD-${Date.now()}-${addRandomSuffix(4)}`;
}
const generateVariantSKU = (productName, index) => {
    const short = slugify(productName, {
        lower: true,
        strict: true,
        trim: true
    });

    return `VR-${short}-${index + 1}-∂${addRandomSuffix(4)}`;
}


const createProductController = async (req, res, next) => {
    try {
        const {
            name,
            description = "",
            price,
            category,
            brand,
            stock = 0,
            thumbnail = "",
            variants = [],
        } = req.body;

        // 1) Tạo slug từ tên sản phẩm
        const baseSlug = slugify(name, {
            lower: true,
            strict: true,
            trim: true
        })


        let slug = baseSlug;
        let counter = 1;
        while (await Product.exists({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        // 2) SKU tự động
        const sku = generateProductSKU();


        // 3) Chuẩn hóa variants data
        const normalizedVariants = variants.map((v, idx) => ({
            name: v.name?.trim() || `Variant ${idx + 1}`,
            sku: v.sku?.trim() || generateVariantSKU(name, idx),
            price: Number.isFinite(Number(v.price)) ? Number(v.price) : Number(price),
            stock: Number.isInteger(Number(v.stock)) ? Number(v.stock) : Number(stock),
            attributes: v.attributes || {},
        }));

        const payload = {
            name: name.trim(),
            description,
            slug,
            sku,
            price: Number(price),
            category,
            brand: brand || undefined,
            stock: Number(stock),
            thumbnail,
            variants: normalizedVariants,
            viewCount: 0,
            deleted: false,
            createdBy: req.user._id
        };

        const created = await Product.create(payload);

        res.status(201).json({
            success: true,
            message: 'Tạo sản phẩm thành công',
            data: created,
        })

    } catch (error) {
        next(error);
    }
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


const getProductsDetail = async (req, res, next) => {
    try {
        const { id } = req.params;

        // validate id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.return.status(400).json({
                success: false,
                message: "Product ID không hợp lệ"
            })
        }

        // find product + populate category, brand
        const product = await Product.findOne({
            _id: id,
            deleted: { $ne: true }, // Nếu model soft delete
        })
            .populate("category", "name slug")
            .populate("brand", "name slug")
            .lean();

        if (!product) {
            res.return.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            })
        }


        // Update viewcount

        // Find related products
        const relatedFilter = {
            _id: { $ne: id },
            deleted: { $ne: true },
            category: product.category._id,
        }

        if (product.brand._id) {
            relatedFilter.brand = product.brand._id;
        }

        const relatedProducts = await Product.find(relatedFilter)
            .populate("category", "name slug")
            .populate("brand", "name slug")
            .sort({ createAt: -1 })
            .limit(8)
            .lean();

        res.status(200).json({
            success: true,
            méssage: 'Lấy chi tiết sản phẩm thành công',
            data: product,
            relatedProducts
        });

    } catch (error) {
        next(error);
    }
}

export { createProductController, updateFullProductController, updateProductController, deleteProductController, getProducts, getProductsDetail };