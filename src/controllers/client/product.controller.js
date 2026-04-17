import { NotFoundError } from "../../utils/errors.js";
import Product from "../../models/Product.js"
import Category from "../../models/Category.js"
import mongoose from "mongoose";
import slugify from "slugify";
import AuditLog from "../../models/AuditLog.js";
import {
    getCategoryDescendants,
    getCategoryBreadcrumb,
    getCategoryProductCount,
    getCategoryStats,
    getCategory
} from "../../services/category.service.js";


const addRandomSuffix = (sku, length = 4) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < length; i++) {
        suffix += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return suffix;
};

const generateVariantSKU = (productName, index) => {
    const short = slugify(productName, {
        lower: true,
        strict: true,
        trim: true
    });

    return `VR-${short}-${index + 1}-∂${addRandomSuffix(4)}`;
}
const parseTagsInput = (raw) => {
    if (Array.isArray(raw)) {
        return raw.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
    }
    if (typeof raw === 'string') {
        return raw
            .split(/[,#]/)
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
    }
    return [];
};

/** Khớp productVariantSchema: sku, attributes (object), price, stock, compareAtPrice (optional) */
const normalizeVariant = (variant, index, fallbackName, fallbackPrice, fallbackStock) => {
    const priceNum = Number.isFinite(Number(variant?.price))
        ? Number(variant.price)
        : Number(fallbackPrice);
    const stockRaw = Number.isFinite(Number(variant?.stock))
        ? Number(variant.stock)
        : Number(fallbackStock);
    const stockNum = Math.max(0, Math.floor(stockRaw));
    let compareAtPrice;
    if (
        variant?.compareAtPrice !== undefined &&
        variant?.compareAtPrice !== '' &&
        Number.isFinite(Number(variant.compareAtPrice))
    ) {
        compareAtPrice = Number(variant.compareAtPrice);
    }
    const attrs = variant?.attributes;
    const attributes =
        attrs && typeof attrs === 'object' && !Array.isArray(attrs) ? attrs : {};
    const out = {
        sku: variant?.sku?.trim() || generateVariantSKU(fallbackName, index),
        price: Math.max(0, priceNum),
        stock: stockNum,
        attributes,
    };
    if (compareAtPrice !== undefined) {
        out.compareAtPrice = compareAtPrice;
    }
    return out;
};

/**
 * So sánh shallow để lấy danh sách field thay đổi phục vụ audit.
 * Với object nested sâu, bạn có thể thay bằng deep-diff library.
 */
const getChangedFields = (before, after, fields) => {
    const changed = [];
    for (const key of fields) {
        const b = JSON.stringify(before?.[key]);
        const a = JSON.stringify(after?.[key]);
        if (b !== a) changed.push(key);
    }
    return changed;
};
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

        // 2) Ảnh cấp product (schema: images[])
        const images = [];
        if (thumbnail && String(thumbnail).trim()) {
            images.push(String(thumbnail).trim());
        }

        // 3) Variants — schema bắt buộc ít nhất 1 variant; giá/tồn kho nằm trên variant
        const nameTrim = name.trim();
        const priceNum = Number(price);
        const stockNum = Number(stock);
        const variantsSource =
            Array.isArray(variants) && variants.length > 0
                ? variants
                : [
                      {
                          price: priceNum,
                          stock: stockNum,
                          compareAtPrice: req.body.compareAtPrice,
                          sku: req.body.variantSku,
                          attributes: {},
                      },
                  ];
        const normalizedVariants = variantsSource.map((v, idx) =>
            normalizeVariant(v, idx, nameTrim, priceNum, stockNum)
        );

        const shortRaw =
            typeof req.body.shortDescription === 'string'
                ? req.body.shortDescription.trim()
                : '';
        const payload = {
            name: nameTrim,
            description,
            shortDescription: shortRaw || undefined,
            slug,
            category,
            brand: brand || undefined,
            images,
            tags: parseTagsInput(req.body.tags),
            status: req.body.status || 'draft',
            featured: !!req.body.featured,
            variants: normalizedVariants,
            createdBy: req.user._id,
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

const updateFullProductController = async (req, res, next) => {
    try {
        const { id } = req.params;
        // 1) Lấy product hiện tại
        const existing = await Product.findOne({ _id: id, deleted: { $ne: true } });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm",
            });
        }
        // 2) Chuẩn bị payload partial update
        // Chỉ set field nào có trong req.body để tránh ghi đè không mong muốn.
        const updatePayload = {};
        if (typeof req.body.name === "string") {
            const nextName = req.body.name.trim();
            // Nếu name đổi => regenerate slug
            if (nextName !== existing.name) {
                const baseSlug = slugify(nextName, { lower: true, strict: true, trim: true });
                let nextSlug = baseSlug;
                let counter = 1;
                // Đảm bảo slug unique, loại trừ chính product hiện tại
                while (
                    await Product.exists({
                        _id: { $ne: existing._id },
                        slug: nextSlug,
                    })
                ) {
                    nextSlug = `${baseSlug}-${counter}`;
                    counter += 1;
                }
                updatePayload.slug = nextSlug;
            }
            updatePayload.name = nextName;
        }
        if (typeof req.body.description === "string") {
            updatePayload.description = req.body.description;
        }
        if (typeof req.body.shortDescription === "string") {
            const s = req.body.shortDescription.trim();
            updatePayload.shortDescription = s || undefined;
        }
        if (req.body.category !== undefined) {
            updatePayload.category = req.body.category;
        }
        if (req.body.brand !== undefined) {
            // Cho phép set null để remove brand nếu muốn
            updatePayload.brand = req.body.brand || null;
        }
        if (req.body.status !== undefined) {
            updatePayload.status = req.body.status;
        }
        if (req.body.featured !== undefined) {
            updatePayload.featured = !!req.body.featured;
        }
        if (req.body.tags !== undefined) {
            updatePayload.tags = parseTagsInput(req.body.tags);
        }
        if (Array.isArray(req.body.images)) {
            updatePayload.images = req.body.images.map((u) => String(u).trim()).filter(Boolean);
        } else if (req.body.thumbnail !== undefined) {
            if (req.body.thumbnail && String(req.body.thumbnail).trim()) {
                updatePayload.images = [String(req.body.thumbnail).trim()];
            }
        }
        // 3) Cập nhật variants nếu có
        // Strategy đơn giản: nếu client gửi variants thì replace toàn bộ mảng.
        // Ưu điểm: dễ kiểm soát tính nhất quán dữ liệu.
        if (Array.isArray(req.body.variants)) {
            const baseName = updatePayload.name || existing.name;
            const v0 = existing.variants?.[0];
            const basePrice = v0?.price ?? 0;
            const baseStock = v0?.stock ?? 0;
            const incoming = req.body.variants.map((v, idx) =>
                normalizeVariant(v, idx, baseName, basePrice, baseStock)
            );
            const existingList = existing.variants || [];
            if (existingList.length > 1 && incoming.length === 1) {
                const tail = existingList
                    .slice(1)
                    .map((doc) => (doc.toObject ? doc.toObject() : doc));
                updatePayload.variants = [...incoming, ...tail];
            } else {
                updatePayload.variants = incoming;
            }
        }
        // Nếu không có field nào để update thì trả luôn
        if (Object.keys(updatePayload).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Không có dữ liệu cập nhật",
            });
        }
        // 4) Cập nhật DB
        const updated = await Product.findByIdAndUpdate(existing._id, updatePayload, {
            new: true,
            runValidators: true,
        }).populate("category", "name slug");
        // 5) Audit log: ghi lại các field thay đổi
        const changedFields = getChangedFields(
            existing.toObject(),
            updated.toObject(),
            [
                "name",
                "slug",
                "description",
                "shortDescription",
                "category",
                "brand",
                "images",
                "variants",
                "tags",
                "status",
                "featured",
            ]
        );
        // userId lấy từ middleware auth (nếu có)
        const actorId = req.user?._id || null;
        await AuditLog.create({
            action: "PRODUCT_UPDATE",
            entity: "Product",
            entityId: String(updated._id),
            actorId,
            changedFields,
            before: {
                name: existing.name,
                slug: existing.slug,
                description: existing.description,
                shortDescription: existing.shortDescription,
                category: existing.category,
                brand: existing.brand,
                images: existing.images,
                variants: existing.variants,
                tags: existing.tags,
                status: existing.status,
                featured: existing.featured,
            },
            after: {
                name: updated.name,
                slug: updated.slug,
                description: updated.description,
                shortDescription: updated.shortDescription,
                category: updated.category,
                brand: updated.brand,
                images: updated.images,
                variants: updated.variants,
                tags: updated.tags,
                status: updated.status,
                featured: updated.featured,
            },
            ip: req.ip,
            userAgent: req.headers["user-agent"] || "",
        });
        return res.status(200).json({
            success: true,
            message: "Cập nhật sản phẩm thành công",
            data: updated,
            meta: {
                changedFields,
            },
        });
    } catch (error) {
        next(error);
    }
}

const updateProductController = (req, res) => {
    console.log("Đã thêm mới sản phẩm");
    res.send('Create Product endpoint');
}

/**
 * DELETE /api/v1/products/:id — Xóa mềm (ẩn khỏi catalog)
 * - set deleted=true, status='deleted', deletedAt, deletedBy
 */
export const softDeleteProductController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const actorId = req.user?._id || null;
        // Chỉ soft-delete item chưa bị xóa
        const product = await Product.findOne({
            _id: id,
            deleted: { $ne: true },
            status: { $ne: "deleted" },
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm hoặc đã bị xóa",
            });
        }
        product.deleted = true;
        product.status = "deleted";
        product.deletedAt = new Date();
        product.deletedBy = actorId;
        await product.save();
        // Audit log để truy vết
        await AuditLog.create({
            action: "PRODUCT_SOFT_DELETE",
            entity: "Product",
            entityId: String(product._id),
            actorId,
            changedFields: ["deleted", "status", "deletedAt", "deletedBy"],
            before: { deleted: false, status: "active", deletedAt: null },
            after: {
                deleted: product.deleted,
                status: product.status,
                deletedAt: product.deletedAt,
                deletedBy: product.deletedBy,
            },
            ip: req.ip,
            userAgent: req.headers["user-agent"] || "",
        });
        return res.status(200).json({
            success: true,
            message: "Đã xóa mềm sản phẩm",
            data: {
                _id: product._id,
                status: product.status,
                deleted: product.deleted,
                deletedAt: product.deletedAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/products/:id/restore — Khôi phục sau xóa mềm
 */
export const restoreDeletedProductController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const actorId = req.user?._id || null;
        const product = await Product.findOne({
            _id: id,
            deleted: true,
            status: "deleted",
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm đã xóa để khôi phục",
            });
        }
        const before = {
            deleted: product.deleted,
            status: product.status,
            deletedAt: product.deletedAt,
            deletedBy: product.deletedBy,
        };
        product.deleted = false;
        product.status = "active";
        product.deletedAt = null;
        product.deletedBy = null;
        await product.save();
        await AuditLog.create({
            action: "PRODUCT_RESTORE",
            entity: "Product",
            entityId: String(product._id),
            actorId,
            changedFields: ["deleted", "status", "deletedAt", "deletedBy"],
            before,
            after: {
                deleted: product.deleted,
                status: product.status,
                deletedAt: product.deletedAt,
                deletedBy: product.deletedBy,
            },
            ip: req.ip,
            userAgent: req.headers["user-agent"] || "",
        });
        return res.status(200).json({
            success: true,
            message: "Khôi phục sản phẩm thành công",
            data: {
                _id: product._id,
                status: product.status,
                deleted: product.deleted,
                deletedAt: product.deletedAt,
            },
        });
    } catch (error) {
        next(error);
    }
}

const toNumber = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}
const buildSort = (sort) => {
    const sortMap = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        name_asc: { name: 1 },
        name_desc: { name: -1 },
    }

    return sortMap[sort] || { createdAt: -1 };
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

        // Filter category/brand with hierarchy support
        let categoryFilter = null;
        if (req.query.category) {
            // Lấy category và tất cả category con
            const categoryIds = await getCategoryDescendants(req.query.category, true);
            if (categoryIds.length > 0) {
                categoryFilter = { $in: categoryIds };
            }
        }
        if (categoryFilter) {
            filter.category = categoryFilter;
        }
        if (req.query.brand) filter.brand = req.query.brand;

        // Filter price range
        const minPrice = toNumber(req.query.minPrice, null);
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

        // 4. Query: list + total using aggregation for price filtering
        let query = Product.aggregate([]);

        // Add match stage for basic filters
        query = query.match(filter);

        // Add variant price info if needed for sorting/filtering
        if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
            query = query
                .addFields({
                    variantMinPrice: {
                        $min: '$variants.price'
                    }
                });

            const priceMatchCondition = {};
            if (Number.isFinite(minPrice)) {
                priceMatchCondition.variantMinPrice = { $gte: minPrice };
            }
            if (Number.isFinite(maxPrice)) {
                if (priceMatchCondition.variantMinPrice) {
                    priceMatchCondition.variantMinPrice.$lte = maxPrice;
                } else {
                    priceMatchCondition.variantMinPrice = { $lte: maxPrice };
                }
            }
            query = query.match(priceMatchCondition);
        }

        // Add population and sorting
        query = query
            .lookup({
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category'
            })
            .unwind({ path: '$category', preserveNullAndEmptyArrays: true })
            .project({
                'category.name': 1,
                'category.slug': 1,
                _id: 1,
                name: 1,
                description: 1,
                slug: 1,
                sku: 1,
                variants: 1,
                images: 1,
                brand: 1,
                tags: 1,
                featured: 1,
                rating: 1,
                viewCount: 1,
                createdAt: 1,
                updatedAt: 1,
                variantMinPrice: 1
            })
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const products = await query.exec();

        // Count total items
        let totalItems;
        if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
            // For counting with price filter, use aggregation
            const countPipeline = [
                { $match: filter },
                {
                    $addFields: {
                        variantMinPrice: { $min: '$variants.price' }
                    }
                }
            ];

            const priceMatchCondition = {};
            if (Number.isFinite(minPrice)) {
                priceMatchCondition.variantMinPrice = { $gte: minPrice };
            }
            if (Number.isFinite(maxPrice)) {
                if (priceMatchCondition.variantMinPrice) {
                    priceMatchCondition.variantMinPrice.$lte = maxPrice;
                } else {
                    priceMatchCondition.variantMinPrice = { $lte: maxPrice };
                }
            }
            countPipeline.push({ $match: priceMatchCondition });

            const countResult = await Product.aggregate(countPipeline);
            totalItems = countResult.length;
        } else {
            totalItems = await Product.countDocuments(filter);
        }


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
            return res.status(400).json({
                success: false,
                message: "Product ID không hợp lệ"
            });
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
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }


        // Update viewcount

        // Find related products
        const relatedFilter = {
            _id: { $ne: id },
            deleted: { $ne: true },
            category: product.category && product.category._id ? product.category._id : product.category,
        };

        if (product.brand && product.brand._id) {
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

const buildSortSearch = (sort) => {
    switch (sort) {
        case "newest":
            return { createdAt: -1 };
        case "price_asc":
            return { price: 1 };
        case "price_desc":
            return { price: -1 };
        default:
            return { score: { $meta: "textScore" } };
    }
}

const searchProduct = async (req, res, next) => {
    try {
        const q = req.query.q || "";

        const keyword = q.trim();

        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập từ khóa tìm kiếm"
            });
        }

        const filter = {
            deleted: { $ne: true },
            status: { $ne: "deleted" },
            $text: { $search: keyword }
        };
        // parse page, đảm bảo page >= 1
        const page = Math.max(Number(req.query.page) || 1, 1);


        // Parse limit, giới hạn 1...199
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);


        const skip = (page - 1) * limit;

        if (req.query.category) filter.category = req.query.category;
        if (req.query.brand) filter.brand = req.query.brand;
        const minPrice = Number(req.query.minPrice);
        const maxPrice = Number(req.query.maxPrice);

        if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
            filter.price = {};
            if (Number.isFinite(minPrice)) filter.price.$gte = minPrice;
            if (Number.isFinite(maxPrice)) filter.price.$lte = maxPrice;
        }

        // Projection field cần phải trả về
        const projection = {
            score: { $meta: "textScore" },
            name: 1,
            description: 1,
            tags: 1,
            price: 1,
            category: 1,
            brand: 1,
            thumbnail: 1,
            createdAt: 1
        }

        const sort = buildSortSearch(req.query.sort);

        const products = await Product.find(filter, projection)
            .populate("category", "name slug")
            .populate("brand", "name slug")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const totalItems = await Product.countDocuments(filter);

        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            success: true,
            message: "Tìm kiếm sản phẩm thành công",
            data: products,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages
            }
        });

    } catch (error) {
        next(error);
    }
}

/**
 * LAY PRODUCTS BY CATEGORY (HỖ TRỢ TREE FILTERING)
 * GET /api/products/category/:categoryId?page=1&limit=10&sort=newest
 * 
 * Chức năng:
 * - Lọc sản phẩm theo category (bao gồm tất cả category con)
 * - Phân trang, sắp xếp
 * - Trả về breadcrumb navigation
 * - Trả về danh sách category con với product count
 */
const getProductsByCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        // 1. Validate category ID
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: "Category ID không hợp lệ"
            });
        }

        // 2. Lấy thông tin category + breadcrumb
        const category = await getCategory(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Danh mục không tồn tại"
            });
        }

        const breadcrumb = await getCategoryBreadcrumb(categoryId);

        // 3. Parse pagination
        const page = Math.max(toNumber(req.query.page, 1), 1);
        const limit = Math.min(Math.max(toNumber(req.query.limit, 10), 1), 100);
        const skip = (page - 1) * limit;

        // 4. Lấy tất cả category con (descendants)
        const categoryIds = await getCategoryDescendants(categoryId, true);

        // 5. Build filter
        const filter = {
            deleted: { $ne: true },
            category: { $in: categoryIds }
        };

        // Optional filters
        if (req.query.brand) filter.brand = req.query.brand;

        const minPrice = toNumber(req.query.minPrice, null);
        const maxPrice = toNumber(req.query.maxPrice, null);
        if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
            filter.price = {};
            if (Number.isFinite(minPrice)) filter.price.$gte = minPrice;
            if (Number.isFinite(maxPrice)) filter.price.$lte = maxPrice;
        }

        // Search
        if (req.query.search) {
            const keyword = req.query.search.trim();
            filter.$or = [
                { name: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
            ];
        }

        // 6. Build sort
        const sort = buildSort(req.query.sort);

        // 7. Query products
        const products = await Product.find(filter)
            .populate("category", "name slug")
            .populate("brand", "name slug")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const totalItems = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / limit);

        // 8. Lấy danh sách category con với product count
        const children = await Category.find(
            { parent: categoryId, status: 'active' },
            '_id name slug featured'
        ).sort({ order: 1 });

        const childrenWithCount = await Promise.all(
            children.map(async (child) => ({
                id: child._id,
                name: child.name,
                slug: child.slug,
                featured: child.featured,
                productCount: await getCategoryProductCount(child._id)
            }))
        );

        res.status(200).json({
            success: true,
            message: 'Lấy sản phẩm theo danh mục thành công',
            data: {
                category: {
                    id: category._id,
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                    image: category.image
                },
                breadcrumb,
                products,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },
                filters: {
                    brand: req.query.brand || null,
                    minPrice,
                    maxPrice,
                    search: req.query.search || null,
                    sort: req.query.sort || "newest",
                },
                subcategories: childrenWithCount
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * LAY CATEGORY STATS
 * GET /api/products/category-stats/:categoryId
 * 
 * Trả về:
 * - Breadcrumb navigation
 * - Product count của category và mỗi subcategory
 * - Thông tin chi tiết category
 */
const getCategoryStatsController = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        // Validate
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: "Category ID không hợp lệ"
            });
        }

        // Lấy category stats
        const stats = await getCategoryStats(categoryId);

        if (!stats) {
            return res.status(404).json({
                success: false,
                message: "Danh mục không tồn tại"
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thống kê danh mục thành công',
            data: stats
        });

    } catch (error) {
        next(error);
    }
};

/**
 * LAY CATEGORY FILTERS
 * GET /api/products/category/:categoryId/filters
 * 
 * Trả về các tùy chọn lọc có sẵn cho category:
 * - Danh sách brands
 * - Price range (min, max)
 * - Subcategories
 */
const getCategoryFiltersController = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        // Validate
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: "Category ID không hợp lệ"
            });
        }

        // Lấy tất cả category con
        const categoryIds = await getCategoryDescendants(categoryId, true);

        // Lấy danh sách brands
        const brands = await Product.distinct('brand', {
            category: { $in: categoryIds },
            deleted: { $ne: true }
        });

        // Lấy price range
        const priceStats = await Product.aggregate([
            {
                $match: {
                    category: { $in: categoryIds },
                    deleted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }
        ]);

        const { minPrice = 0, maxPrice = 0 } = priceStats[0] || {};

        // Lấy subcategories
        const subcategories = await Category.find(
            { parent: categoryId, status: 'active' },
            '_id name slug'
        ).sort({ order: 1 });

        const subcategoriesWithCount = await Promise.all(
            subcategories.map(async (cat) => ({
                id: cat._id,
                name: cat.name,
                slug: cat.slug,
                productCount: await getCategoryProductCount(cat._id)
            }))
        );

        res.status(200).json({
            success: true,
            message: 'Lấy các tùy chọn lọc thành công',
            data: {
                brands: brands.filter(b => b),
                priceRange: {
                    min: minPrice,
                    max: maxPrice
                },
                subcategories: subcategoriesWithCount
            }
        });

    } catch (error) {
        next(error);
    }
};

export {
    createProductController,
    updateFullProductController,
    updateProductController,
    getProducts,
    getProductsDetail,
    searchProduct,
    getProductsByCategory,
    getCategoryStatsController,
    getCategoryFiltersController,
};