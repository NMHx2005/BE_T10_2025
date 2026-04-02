import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";

/**
 * GENERATE ORDER NUMBER
 * Format: ORD-20240101-001
 */
const generateOrderNumber = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const count = await Order.countDocuments({
        createdAt: {
            $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        }
    });

    return `ORD-${dateStr}-${String(count + 1).padStart(3, '0')}`;
};

/**
 * GET /api/orders
 * Lấy danh sách đơn hàng của user (hoặc tất cả nếu admin)
 */
export const getOrders = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { status, page = 1, limit = 10 } = req.query;

        // Build filter
        const filter = { customer: userId };
        if (status && ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(status)) {
            filter.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const orders = await Order.find(filter)
            .populate('customer', 'email username avatar')
            .populate('items.product', 'name slug price thumbnail')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách đơn hàng thành công',
            data: orders,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/orders/:id
 * Lấy chi tiết một đơn hàng
 */
export const getOrderDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const order = await Order.findById(id)
            .populate('customer', 'email username avatar')
            .populate('items.product', 'name slug price thumbnail');

        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        // Kiểm tra quyền: user chỉ xem được đơn hàng của mình (ngoại trừ admin)
        if (req.user.role !== 'admin' && order.customer._id.toString() !== userId.toString()) {
            throw new NotFoundError('Bạn không có quyền xem đơn hàng này');
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/orders
 * Tạo đơn hàng mới
 */
export const createOrder = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const {
            items,
            shippingAddress,
            billingAddress,
            shippingFee = 0,
            tax = 0,
            discount = 0,
            paymentMethod = 'cod',
            shippingMethod = 'standard',
            notes = ''
        } = req.body;

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new ValidationError('Đơn hàng phải có ít nhất một sản phẩm');
        }

        if (!shippingAddress) {
            throw new ValidationError('Địa chỉ giao hàng là bắt buộc');
        }

        // Validate items và tính subtotal
        const orderItems = [];
        let subtotal = 0;

        for (const item of items) {
            const { productId, quantity, variantName } = item;

            if (!productId || !quantity || quantity < 1) {
                throw new ValidationError('Dữ liệu sản phẩm không hợp lệ');
            }

            const product = await Product.findById(productId).select('name price stock thumbnail');
            if (!product) {
                throw new NotFoundError(`Sản phẩm ${productId} không tồn tại`);
            }

            if (product.stock < quantity) {
                throw new ValidationError(`Sản phẩm "${product.name}" không đủ số lượng`);
            }

            const itemSubtotal = product.price * quantity;
            subtotal += itemSubtotal;

            orderItems.push({
                product: productId,
                productName: product.name,
                price: product.price,
                quantity,
                variant: variantName ? { name: variantName } : undefined,
                subtotal: itemSubtotal
            });
        }

        // Tính tổng
        const total = subtotal + shippingFee + tax - Math.max(0, discount);

        // Tạo đơn hàng
        const orderNumber = await generateOrderNumber();

        const newOrder = await Order.create({
            orderNumber,
            customer: userId,
            items: orderItems,
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            subtotal,
            shippingFee,
            tax,
            discount: Math.max(0, discount),
            total,
            payment: {
                method: paymentMethod,
                status: 'pending'
            },
            shipping: {
                method: shippingMethod
            },
            notes,
            status: 'pending'
        });

        // Reduce stock cho mỗi sản phẩm
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } }
            );
        }

        const populatedOrder = await Order.findById(newOrder._id)
            .populate('customer', 'email username avatar')
            .populate('items.product', 'name slug price thumbnail');

        res.status(201).json({
            success: true,
            message: 'Tạo đơn hàng thành công',
            data: populatedOrder
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/orders/:id
 * Cập nhật đơn hàng (admin)
 */
export const updateOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, shippingAddress, notes, paymentStatus, trackingNumber } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        // Cập nhật fields
        if (status && ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(status)) {
            // Kiểm tra transition hợp lệ
            if (status === 'shipped' && !order.shipping.trackingNumber && !trackingNumber) {
                throw new ValidationError('Mã tracking là bắt buộc khi gửi hàng');
            }
            order.status = status;
        }

        if (shippingAddress) {
            order.shippingAddress = { ...order.shippingAddress, ...shippingAddress };
        }

        if (notes !== undefined) {
            order.notes = notes;
        }

        if (paymentStatus && ['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
            order.payment.status = paymentStatus;
            if (paymentStatus === 'paid') {
                order.payment.paidAt = new Date();
            }
        }

        if (trackingNumber) {
            order.shipping.trackingNumber = trackingNumber;
        }

        order.updatedAt = new Date();
        await order.save();

        const populatedOrder = await Order.findById(id)
            .populate('customer', 'email username avatar')
            .populate('items.product', 'name slug price thumbnail');

        res.status(200).json({
            success: true,
            message: 'Cập nhật đơn hàng thành công',
            data: populatedOrder
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/orders/:id/cancel
 * Hủy đơn hàng
 */
export const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason = '' } = req.body;
        const userId = req.user._id;

        const order = await Order.findById(id);
        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        // Kiểm tra quyền
        if (req.user.role !== 'admin' && order.customer.toString() !== userId.toString()) {
            throw new NotFoundError('Bạn không có quyền hủy đơn hàng này');
        }

        // Kiểm tra trạng thái có thể hủy không
        if (!['pending', 'confirmed'].includes(order.status)) {
            throw new ValidationError('Chỉ có thể hủy đơn hàng ở trạng thái chờ xác nhận hoặc đã xác nhận');
        }

        // Hủy đơn hàng
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.notes = (order.notes ? order.notes + '\n' : '') + `Hủy: ${reason}`;

        // Restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Hủy đơn hàng thành công',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/orders/:id
 * Xóa đơn hàng (admin, chỉ xóa draft)
 */
export const deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id);
        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        // Chỉ cho xóa đơn hàng pending
        if (order.status !== 'pending') {
            throw new ValidationError('Chỉ có thể xóa đơn hàng ở trạng thái chờ xác nhận');
        }

        // Restore stock trước khi xóa
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }

        await Order.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Xóa đơn hàng thành công'
        });
    } catch (error) {
        next(error);
    }
};
