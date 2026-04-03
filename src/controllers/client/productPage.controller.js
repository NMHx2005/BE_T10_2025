import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';

function parseCategoryIds(query) {
    let raw = query.category;
    if (!raw) return [];
    if (!Array.isArray(raw)) raw = [raw];
    return raw
        .filter(Boolean)
        .map(String)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
}

function buildProductFilter(req) {
    const filter = {
        status: 'active',
        deleted: { $ne: true },
    };

    const search = (req.query.search || req.query.q || '').trim();
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { shortDescription: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } },
        ];
    }

    const brand = (req.query.brand || '').trim();
    if (brand) {
        filter.brand = { $regex: brand, $options: 'i' };
    }

    const categoryIds = parseCategoryIds(req.query);
    if (categoryIds.length) {
        filter.category = {
            $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
        };
    }

    const minP = req.query.minPrice !== undefined && req.query.minPrice !== '' ? Number(req.query.minPrice) : NaN;
    const maxP = req.query.maxPrice !== undefined && req.query.maxPrice !== '' ? Number(req.query.maxPrice) : NaN;
    const priceCond = {};
    if (Number.isFinite(minP)) priceCond.$gte = minP;
    if (Number.isFinite(maxP)) priceCond.$lte = maxP;
    if (Object.keys(priceCond).length) {
        filter.variants = { $elemMatch: { price: priceCond, isActive: true } };
    }

    return filter;
}

function sortForFind(sort) {
    switch (sort) {
        case 'oldest':
            return { createdAt: 1 };
        case 'name_asc':
            return { name: 1 };
        case 'name_desc':
            return { name: -1 };
        case 'newest':
        default:
            return { createdAt: -1 };
    }
}

/**
 * GET /products — SSR danh sách sản phẩm
 */
export async function renderProductsPage(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
        const skip = (page - 1) * limit;
        const sort = req.query.sort || 'newest';
        const match = buildProductFilter(req);
        const selectedCategoryIds = parseCategoryIds(req.query);

        const categories = await Category.find({ status: 'active' })
            .select('name')
            .sort({ name: 1 })
            .lean();

        let products = [];
        let total = 0;

        if (sort === 'price_asc' || sort === 'price_desc') {
            const order = sort === 'price_asc' ? 1 : -1;
            const agg = await Product.aggregate([
                { $match: match },
                { $addFields: { __minP: { $min: '$variants.price' } } },
                { $sort: { __minP: order, _id: 1 } },
                {
                    $facet: {
                        meta: [{ $count: 'total' }],
                        data: [{ $skip: skip }, { $limit: limit }, { $project: { _id: 1 } }],
                    },
                },
            ]);
            total = agg[0]?.meta[0]?.total ?? 0;
            const ids = (agg[0]?.data || []).map((d) => d._id);
            if (ids.length) {
                products = await Product.find({ _id: { $in: ids } })
                    .populate('category', 'name slug')
                    .lean({ virtuals: true });
                const rank = new Map(ids.map((id, i) => [id.toString(), i]));
                products.sort(
                    (a, b) => rank.get(a._id.toString()) - rank.get(b._id.toString()),
                );
            }
        } else {
            total = await Product.countDocuments(match);
            products = await Product.find(match)
                .populate('category', 'name slug')
                .sort(sortForFind(sort))
                .skip(skip)
                .limit(limit)
                .lean({ virtuals: true });
        }

        const totalPages = Math.max(1, Math.ceil(total / limit));

        res.render('pages/client/products', {
            title: 'Sản phẩm — PRO-TOOLS',
            products,
            categories,
            totalItems: total,
            page,
            limit,
            totalPages,
            search: (req.query.search || req.query.q || '').trim(),
            brand: (req.query.brand || '').trim(),
            sort,
            minPrice: req.query.minPrice !== undefined && req.query.minPrice !== '' ? req.query.minPrice : '',
            maxPrice: req.query.maxPrice !== undefined && req.query.maxPrice !== '' ? req.query.maxPrice : '',
            selectedCategoryIds,
        });
    } catch (err) {
        next(err);
    }
}
