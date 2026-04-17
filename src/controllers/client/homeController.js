import Category from '../../models/Category.js';
import Product from '../../models/Product.js';

const PLACEHOLDER_CATEGORY_IMG =
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80';
const PLACEHOLDER_PRODUCT_IMG =
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=544&q=80';

function formatVnd(n) {
    if (n == null || Number.isNaN(Number(n))) return '—';
    return `${new Intl.NumberFormat('vi-VN').format(Math.round(Number(n)))}₫`;
}

function normalizeImgRef(ref) {
    if (ref == null) return null;
    if (typeof ref === 'string') {
        const s = ref.trim();
        return s || null;
    }
    if (typeof ref === 'object') {
        if (typeof ref.url === 'string' && ref.url.trim()) return ref.url.trim();
        if (typeof ref.secure_url === 'string' && ref.secure_url.trim()) return ref.secure_url.trim();
    }
    return null;
}

function productCardImage(product) {
    if (product.images && product.images.length > 0) {
        const u = normalizeImgRef(product.images[0]);
        if (u) return u;
    }
    if (Array.isArray(product.variants)) {
        for (const v of product.variants) {
            if (v?.images?.length) {
                const u = normalizeImgRef(v.images[0]);
                if (u) return u;
            }
        }
    }
    return PLACEHOLDER_PRODUCT_IMG;
}

/**
 * Trang chủ: 6 danh mục nổi bật + 4 sản phẩm “bán chạy” (theo điểm đánh giá / nổi bật)
 */
export const renderHomePage = async (req, res, next) => {
    try {
        const categoriesRaw = await Category.find({ status: 'active' })
            .sort({ featured: -1, order: 1, name: 1 })
            .limit(6)
            .select('name slug image')
            .lean();

        const featuredCategories = categoriesRaw.map((cat) => ({
            name: cat.name,
            href: `/products?category=${cat._id}`,
            img: cat.image && String(cat.image).trim() ? cat.image : PLACEHOLDER_CATEGORY_IMG,
            alt: cat.name,
        }));

        const productsRaw = await Product.find({
            status: 'active',
            deleted: { $ne: true },
        })
            .sort({ featured: -1, 'rating.average': -1, createdAt: -1 })
            .limit(4)
            .lean({ virtuals: true });

        const bestsellers = productsRaw.map((p) => ({
            name: p.name,
            price: formatVnd(p.minPrice),
            href: `/products/${p._id}`,
            img: productCardImage(p),
            alt: p.name,
            rating: Math.min(5, Math.max(0, Math.round(p.rating?.average ?? 0))),
        }));
        res.render('pages/client/Home/index', {
            title: 'Trang chủ — PRO-TOOLS',
            featuredCategories,
            bestsellers,
        });
    } catch (err) {
        next(err);
    }
};
