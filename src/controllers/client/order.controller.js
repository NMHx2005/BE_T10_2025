import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";
import { getPayOS, buildPayosReturnUrl, buildPayosCancelUrl } from "../../config/payos.js";

function buildAdminOrderExportFilter(query) {
    const { status = '', search = '', payment = '', date = '' } = query;
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
    return filter;
}

function csvEscape(val) {
    const s = val == null ? '' : String(val);
    if (/[",\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function variantAttrsPlain(attrs) {
    if (!attrs) return undefined;
    if (attrs instanceof Map) return Object.fromEntries(attrs);
    if (typeof attrs === 'object') return { ...attrs };
    return undefined;
}

function variantLabel(v) {
    if (!v) return '';
    const sku = v.sku ? String(v.sku) : '';
    const plain = variantAttrsPlain(v.attributes);
    if (!plain || !Object.keys(plain).length) return sku;
    const parts = Object.entries(plain).map(([k, val]) => `${k}: ${val}`);
    return sku ? `${sku} — ${parts.join(', ')}` : parts.join(', ');
}

async function restoreLineStock(line) {
    const vid = line.variant?.variantId;
    if (vid) {
        await Product.updateOne(
            { _id: line.product, 'variants._id': vid },
            { $inc: { 'variants.$.stock': line.quantity } }
        );
    } else {
        await Product.findByIdAndUpdate(line.product, { $inc: { stock: line.quantity } });
    }
}

async function decrementLineStock(line) {
    const vid = line.variant?.variantId;
    if (vid) {
        await Product.updateOne(
            { _id: line.product, 'variants._id': vid },
            { $inc: { 'variants.$.stock': -line.quantity } }
        );
    } else {
        await Product.findByIdAndUpdate(line.product, { $inc: { stock: -line.quantity } });
    }
}

async function allocatePayosOrderCode() {
    for (let i = 0; i < 12; i++) {
        const code = Math.floor(100_000_000 + Math.random() * 899_999_999);
        const exists = await Order.exists({ payosOrderCode: code });
        if (!exists) return code;
    }
    throw new ValidationError('Không tạo được mã thanh toán PayOS, vui lòng thử lại.');
}

function normalizePhone(s) {
    let x = String(s || '').replace(/\s/g, '');
    if (x.startsWith('+84')) x = `0${x.slice(3)}`;
    return x;
}

/**
 * Lõi tạo đơn: validate biến thể, trừ kho, lưu Order. Trả về document đã populate.
 */
async function persistNewOrder(userId, body) {
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
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ValidationError('Đơn hàng phải có ít nhất một sản phẩm');
    }

    if (!shippingAddress) {
        throw new ValidationError('Địa chỉ giao hàng là bắt buộc');
    }

    const allowedPay = ['cod', 'payos', 'bank_transfer', 'credit_card', 'momo', 'zalopay'];
    const payMethod = allowedPay.includes(paymentMethod) ? paymentMethod : 'cod';

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
        const { productId, quantity, variantId } = item;

        if (!productId || !quantity || quantity < 1) {
            throw new ValidationError('Dữ liệu sản phẩm không hợp lệ');
        }

        const product = await Product.findById(productId);
        if (!product) {
            throw new NotFoundError(`Sản phẩm không tồn tại`);
        }

        if (!product.variants?.length) {
            throw new ValidationError(`Sản phẩm "${product.name}" chưa có biến thể để bán`);
        }

        if (!variantId) {
            throw new ValidationError(`Vui lòng chọn biến thể cho "${product.name}"`);
        }

        const v = product.variants.id(variantId);
        if (!v || v.isActive === false) {
            throw new ValidationError(`Biến thể không hợp lệ cho "${product.name}"`);
        }

        if (v.stock < quantity) {
            throw new ValidationError(`"${product.name}" không đủ số lượng trong kho`);
        }

        const unitPrice = v.price;
        const itemSubtotal = unitPrice * quantity;
        subtotal += itemSubtotal;

        orderItems.push({
            product: productId,
            productName: product.name,
            price: unitPrice,
            quantity,
            variant: {
                name: variantLabel(v),
                variantId: v._id,
                attributes: variantAttrsPlain(v.attributes),
            },
            subtotal: itemSubtotal
        });
    }

    const total = subtotal + Number(shippingFee || 0) + Number(tax || 0) - Math.max(0, Number(discount || 0));

    const orderNumber = await generateOrderNumber();

    const newOrder = await Order.create({
        orderNumber,
        customer: userId,
        items: orderItems,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        subtotal,
        shippingFee: Number(shippingFee || 0),
        tax: Number(tax || 0),
        discount: Math.max(0, Number(discount || 0)),
        total,
        payment: {
            method: payMethod,
            status: 'pending'
        },
        shipping: {
            method: shippingMethod
        },
        notes,
        status: 'pending'
    });

    for (const line of orderItems) {
        await decrementLineStock(line);
    }

    return Order.findById(newOrder._id)
        .populate('customer', 'email username avatar')
        .populate('items.product', 'name slug price thumbnail');
}

/**
 * GET /api/v1/orders/export/csv — Admin: xuất CSV (khớp bộ lọc trang đơn)
 */
export const exportOrdersCsv = async (req, res, next) => {
    try {
        const filter = buildAdminOrderExportFilter(req.query);
        const cap = Math.min(10000, Math.max(1, parseInt(req.query.limit, 10) || 8000));
        const orders = await Order.find(filter)
            .populate('customer', 'username email')
            .sort({ createdAt: -1 })
            .limit(cap)
            .lean();

        const headers = [
            'orderNumber',
            'createdAt',
            'status',
            'customerUsername',
            'customerEmail',
            'total',
            'paymentMethod',
            'paymentStatus',
            'itemsCount',
            'shippingCity',
            'shippingPhone',
        ];

        const lines = [headers.join(',')];
        for (const o of orders) {
            const c = o.customer || {};
            const addr = o.shippingAddress || {};
            const row = [
                o.orderNumber,
                o.createdAt ? new Date(o.createdAt).toISOString() : '',
                o.status,
                c.username || '',
                c.email || '',
                o.total,
                o.payment?.method ?? '',
                o.payment?.status ?? '',
                Array.isArray(o.items) ? o.items.length : 0,
                addr.city || '',
                addr.phone || '',
            ].map(csvEscape);
            lines.push(row.join(','));
        }

        const bom = '\uFEFF';
        const csv = bom + lines.join('\r\n');
        const fname = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
        res.send(csv);
    } catch (error) {
        next(error);
    }
};

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
 */
export const getOrders = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { status, page = 1, limit = 10, search = '' } = req.query;

        const filter = { customer: userId };
        if (status && ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(status)) {
            filter.status = status;
        }
        const searchTrim = search && String(search).trim();
        if (searchTrim) {
            const escaped = searchTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.orderNumber = { $regex: escaped, $options: 'i' };
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
 * POST /api/orders — tạo đơn (COD / tương thích cũ)
 */
export const createOrder = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const populatedOrder = await persistNewOrder(userId, req.body);
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
 * POST /api/v1/orders/checkout — tạo đơn + link PayOS nếu chọn payos
 */
export const createCheckout = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const paymentMethod = req.body.paymentMethod === 'payos' ? 'payos' : 'cod';
        const body = { ...req.body, paymentMethod };
        const populatedOrder = await persistNewOrder(userId, body);

        if (paymentMethod !== 'payos') {
            return res.status(201).json({
                success: true,
                message: 'Tạo đơn hàng thành công',
                data: { order: populatedOrder }
            });
        }

        const payos = getPayOS();
        if (!payos) {
            throw new ValidationError(
                'Thanh toán PayOS chưa cấu hình. Thêm PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY vào .env.'
            );
        }

        const order = await Order.findById(populatedOrder._id);
        const payosOrderCode = await allocatePayosOrderCode();
        order.payosOrderCode = payosOrderCode;
        await order.save();

        const returnUrl = buildPayosReturnUrl(order._id);
        const cancelUrl = buildPayosCancelUrl(order._id);

        const amount = Math.round(Number(order.total));
        if (!Number.isFinite(amount) || amount < 1000) {
            throw new ValidationError('Số tiền thanh toán không hợp lệ (tối thiểu 1000₫).');
        }

        const desc = `TT ${order.orderNumber}`.slice(0, 24);
        const paymentLink = await payos.paymentRequests.create({
            orderCode: payosOrderCode,
            amount,
            description: desc,
            returnUrl,
            cancelUrl,
        });

        order.payment.transactionId = paymentLink.paymentLinkId;
        await order.save();

        const refreshed = await Order.findById(order._id)
            .populate('customer', 'email username avatar')
            .populate('items.product', 'name slug price thumbnail');

        return res.status(201).json({
            success: true,
            message: 'Đã tạo đơn hàng. Chuyển tới trang thanh toán PayOS.',
            data: {
                order: refreshed,
                payosCheckoutUrl: paymentLink.checkoutUrl,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/webhooks/payos — PayOS gọi (không JWT)
 */
export const payosWebhookHandler = async (req, res) => {
    try {
        const payos = getPayOS();
        if (!payos) {
            return res.status(503).json({ success: false, message: 'PayOS not configured' });
        }
        let verified;
        try {
            verified = await payos.webhooks.verify(req.body);
        } catch (verErr) {
            console.error('PayOS webhook verify:', verErr.message);
            return res.status(400).json({ success: false, message: 'Invalid webhook' });
        }
        const data = verified?.data;
        const orderCode = data?.orderCode;
        if (orderCode == null) {
            return res.status(400).json({ success: false });
        }

        const order = await Order.findOne({ payosOrderCode: orderCode });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.payment.status !== 'paid') {
            order.payment.status = 'paid';
            order.payment.paidAt = new Date();
            if (order.payment.method === 'payos' && order.status === 'pending') {
                order.status = 'confirmed';
            }
            await order.save();
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('payosWebhookHandler:', err);
        return res.status(500).json({ success: false });
    }
};

/**
 * POST /api/v1/orders/lookup — tra cứu đơn (mã đơn + SĐT nhận hàng), không cần đăng nhập
 */
export const lookupOrder = async (req, res, next) => {
    try {
        const { orderNumber, phone } = req.body;
        if (!orderNumber || !phone) {
            throw new ValidationError('Vui lòng nhập mã đơn hàng và số điện thoại người nhận.');
        }
        const onum = String(orderNumber).trim();
        const p = normalizePhone(phone);

        const order = await Order.findOne({ orderNumber: onum })
            .populate('items.product', 'name slug thumbnail')
            .lean();

        if (!order) {
            throw new NotFoundError('Không tìm thấy đơn hàng.');
        }

        const shipPhone = normalizePhone(order.shippingAddress?.phone || '');
        if (!shipPhone || shipPhone !== p) {
            throw new NotFoundError('Không tìm thấy đơn hàng.');
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/orders/:id
 */
export const updateOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, shippingAddress, notes, paymentStatus, trackingNumber } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        if (status && ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(status)) {
            if (
                status === 'shipped' &&
                !order.shipping?.trackingNumber &&
                !trackingNumber
            ) {
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
            if (!order.shipping) order.shipping = {};
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

        if (req.user.role !== 'admin' && order.customer.toString() !== userId.toString()) {
            throw new NotFoundError('Bạn không có quyền hủy đơn hàng này');
        }

        if (!['pending', 'confirmed'].includes(order.status)) {
            throw new ValidationError('Chỉ có thể hủy đơn hàng ở trạng thái chờ xác nhận hoặc đã xác nhận');
        }

        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.notes = (order.notes ? order.notes + '\n' : '') + `Hủy: ${reason}`;

        for (const item of order.items) {
            await restoreLineStock(item);
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
 */
export const deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id);
        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        if (order.status !== 'pending') {
            throw new ValidationError('Chỉ có thể xóa đơn hàng ở trạng thái chờ xác nhận');
        }

        for (const item of order.items) {
            await restoreLineStock(item);
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
