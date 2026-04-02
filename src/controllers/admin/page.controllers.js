import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import { getCategoryDescendants } from '../../services/category.service.js';

// Get all products with filters and pagination
export const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }
        if (category) {
            filter.category = category;
        }
        if (status) {
            filter.status = status;
        }

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
            product = await Product.findById(id).populate('category');
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
        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) {
            filter.role = role;
        }
        if (status) {
            filter.status = status;
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(filter)
        ]);

        res.render('pages/admin/users', {
            title: 'User Management',
            users,
            pagination: {
                current: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            filters: { search, role, status }
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
        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).render('404', { title: 'User Not Found' });
        }

        // Get user's recent orders
        const Order = require('../../models/Order.js').default;
        const recentOrders = await Order.find({ userId: id })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.render('pages/admin/user-detail', {
            title: `User: ${user.name}`,
            user: {
                ...user.toObject(),
                recentOrders,
                totalOrders: recentOrders.length,
                addressCount: user.addresses ? user.addresses.length : 0
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).render('404', { title: 'Error', error: error.message });
    }
};

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().lean();

        // Build category tree
        const categoryTree = categories.filter(cat => !cat.parent).map(cat => ({
            ...cat,
            children: categories.filter(c => c.parent?.toString() === cat._id.toString())
        }));

        res.render('pages/admin/categories', {
            title: 'Category Management',
            categories: categoryTree,
            allCategories: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).render('404', { title: 'Error', error: error.message });
    }
};

// Get all orders
export const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '', search = '' } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (search) {
            filter.orderNumber = { $regex: search, $options: 'i' };
        }

        const Order = require('../../models/Order.js').default;
        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Order.countDocuments(filter)
        ]);

        res.render('pages/admin/orders', {
            title: 'Order Management',
            orders,
            pagination: {
                current: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            filters: { status, search }
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
        const Order = require('../../models/Order.js').default;
        const order = await Order.findById(id)
            .populate('userId', 'name email')
            .populate('items.product', 'name thumbnail price');

        if (!order) {
            return res.status(404).render('404', { title: 'Order Not Found' });
        }

        res.render('pages/admin/order-detail', {
            title: `Order: ${order.orderNumber}`,
            order: {
                ...order.toObject(),
                customer: order.userId
            }
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).render('404', { title: 'Error', error: error.message });
    }
};
