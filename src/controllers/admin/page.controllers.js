import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';
import { getCategoryDescendants, getCategoryProductCount } from '../../services/category.service.js';

// Get all products with filters and pagination
export const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
        const skip = (page - 1) * limit;

        const and = [];
        if (search) {
            and.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { 'variants.sku': { $regex: search, $options: 'i' } },
                    { brand: { $regex: search, $options: 'i' } },
                ],
            });
        }
        if (category) {
            and.push({ category });
        }
        if (status === 'deleted') {
            and.push({ $or: [{ deleted: true }, { status: 'deleted' }] });
        } else {
            and.push({ deleted: { $ne: true } });
            if (status) {
                and.push({ status });
            } else {
                and.push({ status: { $ne: 'deleted' } });
            }
        }
        const filter = and.length ? { $and: and } : {};

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate('category', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Product.countDocuments(filter)
        ]);

        const categories = await Category.find({ status: 'active' }).select('_id name').lean();

        res.render('pages/admin/products', {
            title: 'Product Management',
            products,
            categories,
            pagination: {
                current: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            filters: { search, category, status }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).render('404', { title: 'Error', error: error.message });
    }
};

// Get product form (for create/edit)
export const getProductForm = async (req, res) => {
    try {
        const { id } = req.params;
        let product = null;
        const categories = await Category.find({ status: 'active' }).select('_id name parent').lean();

        if (id && id !== 'create') {
            product = await Product.findById(id).populate('category').lean();
            if (!product) {
                return res.status(404).render('404', { title: 'Product Not Found' });
            }
        }

        res.render('pages/admin/product-form', {
            title: id && id !== 'create' ? 'Edit Product' : 'Create Product',
            product,
            categories,
            isEdit: !!(product)
        });
    } catch (error) {
        console.error('Error loading product form:', error);
        res.status(500).render('404', { title: 'Error', error: error.message });
    }
};

// Get all users (for admin view)
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const filter = {};
        if (search && String(search).trim()) {
            const q = String(search).trim();
            filter.$or = [
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
            ];
        }
        if (role) {
            filter.role = role;
        }
        if (status) {
            filter.status = status;
        }

        const [usersRaw, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            User.countDocuments(filter),
        ]);

        const orderAgg = await Order.aggregate([
            { $group: { _id: '$customer', orderCount: { $sum: 1 } } },
        ]);
        const countMap = Object.fromEntries(
            orderAgg.map((o) => [String(o._id), o.orderCount]),
        );
        const users = usersRaw.map((u) => ({
            ...u,
            orderCount: countMap[String(u._id)] || 0,
        }));

        const pages = Math.max(1, Math.ceil(total / limitNum));
        let pageStart = Math.max(1, pageNum - 2);
        let pageEnd = Math.min(pages, pageStart + 4);
        if (pageEnd - pageStart < 4) {
            pageStart = Math.max(1, pageEnd - 4);
        }
        const pageNums = [];
        for (let i = pageStart; i <= pageEnd; i += 1) {
            pageNums.push(i);
        }

        res.render('pages/admin/users', {
            title: 'Quản lý người dùng',
            users,
            totalUsers: total,
            pagination: {
                current: pageNum,
                page: pageNum,
                limit: limitNum,
                total,
                pages,
                pageNums,
            },
            filters: { search, role, status },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).render('404', { title: 'Error', error: error.message });
    }
};

// Get single user detail
export const getUserDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password').lean();

        if (!user) {
            return res.status(404).render('404', { title: 'User Not Found' });
        }

        const [recentOrders, totalOrders, spentAgg] = await Promise.all([
            Order.find({ customer: id }).sort({ createdAt: -1 }).limit(5).lean(),
            Order.countDocuments({ customer: id }),
            Order.aggregate([
                { $match: { customer: user._id } },
                { $group: { _id: null, total: { $sum: '$total' } } },
            ]),
        ]);
        const totalSpent = spentAgg[0]?.total || 0;

        res.render('pages/admin/user-detail', {
            title: `Người dùng: ${user.username}`,
            user: {
                ...user,
                recentOrders,
                totalOrders,
                totalSpent,
            },
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).render('404', { title: 'Error', error: error.message });
    }
};

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const { search = '', status = '' } = req.query;
        const filter = {};
        if (search && String(search).trim()) {
            const q = String(search).trim();
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { slug: { $regex: q, $options: 'i' } },
            ];
        }
        if (status && ['active', 'inactive'].includes(status)) {
            filter.status = status;
        }

        const categories = await Category.find(filter).sort({ order: 1, name: 1 }).lean();

        const withCounts = await Promise.all(
            categories.map(async (cat) => ({
                ...cat,
                productCount: await getCategoryProductCount(cat._id),
            })),
        );

        const categoryTree = withCounts
            .filter((cat) => !cat.parent)
            .map((cat) => ({
                ...cat,
                children: withCounts.filter(
                    (c) => c.parent && c.parent.toString() === cat._id.toString(),
                ),
            }));

        const categoriesAdminJson = withCounts.map((c) => ({
            _id: String(c._id),
            name: c.name,
            parent: c.parent ? String(c.parent) : null,
            order: Number(c.order) || 0,
        }));

        res.render('pages/admin/categories', {
            title: 'Quản lý danh mục',
            categories: categoryTree,
            allCategories: withCounts,
            totalCategories: withCounts.length,
            categoriesAdminJson,
            filters: { search, status },
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).render('404', { title: 'Error', error: error.message });
    }
};

// Form chỉnh sửa danh mục (admin)
export const getCategoryForm = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).render('404', { title: 'Category Not Found' });
        }
        const category = await Category.findById(id).lean();
        if (!category) {
            return res.status(404).render('404', { title: 'Category Not Found' });
        }
        const allCategories = await Category.find({ _id: { $ne: category._id } })
            .sort({ order: 1, name: 1 })
            .select('_id name parent')
            .lean();
        const productCount = await getCategoryProductCount(category._id);
        res.render('pages/admin/category-form', {
            title: `Sửa danh mục: ${category.name}`,
            category: { ...category, productCount },
            allCategories,
            isEdit: true,
            filters: {},
        });
    } catch (error) {
        console.error('Error loading category form:', error);
        res.status(500).render('404', { title: 'Error', error: error.message });
    }
};

// Get all orders
export const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '', search = '', payment = '', date = '' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const filter = {};
        if (status && typeof status === 'string') {
            filter.status = status;
        }
        if (payment && typeof payment === 'string') {
            filter['payment.status'] = payment;
        }
        if (search && String(search).trim()) {
            filter.orderNumber = { $regex: String(search).trim(), $options: 'i' };
        }
        if (date && String(date).trim()) {
            const d = new Date(String(date));
            if (!Number.isNaN(d.getTime())) {
                const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                const end = new Date(start);
                end.setDate(end.getDate() + 1);
                filter.createdAt = { $gte: start, $lt: end };
            }
        }

        const [orders, total, statsAgg, totalAllOrders] = await Promise.all([
            Order.find(filter)
                .populate('customer', 'username email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Order.countDocuments(filter),
            Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            Order.countDocuments({}),
        ]);

        const orderStats = {};
        statsAgg.forEach((s) => {
            if (s._id) orderStats[s._id] = s.count;
        });

        const pages = Math.max(1, Math.ceil(total / limitNum));

        res.render('pages/admin/orders', {
            title: 'Quản lý đơn hàng',
            orders,
            orderStats,
            totalOrders: totalAllOrders,
            filteredOrderCount: total,
            pagination: {
                current: pageNum,
                page: pageNum,
                limit: limitNum,
                total,
                pages,
            },
            filters: { status, search, payment, date },
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).render('404', { title: 'Error', error: error.message });
    }
};

// Get single order detail
export const getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id)
            .populate('customer', 'username email')
            .populate('items.product', 'name images slug')
            .lean();

        if (!order) {
            return res.status(404).render('404', { title: 'Order Not Found' });
        }

        res.render('pages/admin/order-detail', {
            title: `Đơn hàng ${order.orderNumber}`,
            order,
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).render('404', { title: 'Error', error: error.message });
    }
};
