import mongoose from 'mongoose';

/**
 * ORDER ITEM SUB-SCHEMA
 * Chi tiết từng sản phẩm trong đơn hàng
 */
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: String,
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    variant: {
        name: String,
        variantId: mongoose.Schema.Types.ObjectId,
        attributes: mongoose.Schema.Types.Mixed
    },
    subtotal: {
        type: Number,
        required: true
    }
}, { _id: true });

/**
 * ORDER SCHEMA
 */
const orderSchema = new mongoose.Schema({
    /**
     * ORDER NUMBER
     * Mã đơn hàng độc nhất (e.g., ORD-20240101-001)
     */
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    /**
     * CUSTOMER
     */
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    /**
     * ITEMS
     * Các sản phẩm trong đơn hàng
     */
    items: [orderItemSchema],

    /**
     * SHIPPING ADDRESS
     */
    shippingAddress: {
        fullName: String,
        phone: String,
        address: String,
        ward: String,
        district: String,
        city: String,
        note: String
    },

    /**
     * BILLING ADDRESS
     */
    billingAddress: {
        fullName: String,
        phone: String,
        address: String,
        ward: String,
        district: String,
        city: String
    },

    /**
     * PRICING
     */
    subtotal: {
        type: Number,
        default: 0,
        min: 0
    },
    shippingFee: {
        type: Number,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },

    /**
     * PayOS: mã số nguyên duy nhất gửi sang PayOS (paymentRequests.orderCode)
     */
    payosOrderCode: {
        type: Number,
        sparse: true,
        unique: true,
        index: true
    },

    /**
     * PAYMENT
     */
    payment: {
        method: {
            type: String,
            enum: ['cod', 'bank_transfer', 'credit_card', 'momo', 'zalopay', 'payos'],
            default: 'cod'
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        paidAt: Date,
        transactionId: String
    },

    /**
     * SHIPPING
     */
    shipping: {
        method: {
            type: String,
            enum: ['standard', 'express', 'overnight'],
            default: 'standard'
        },
        carrier: String,
        trackingNumber: String,
        estimatedDelivery: Date,
        deliveredAt: Date
    },

    /**
     * STATUS
     * Trạng thái đơn hàng
     */
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending',
        index: true
    },

    /**
     * COUPON/PROMO
     */
    coupon: {
        code: String,
        discount: Number
    },

    /**
     * NOTES
     */
    notes: String,

    /**
     * TIMESTAMPS
     */
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    cancelledAt: Date

}, { timestamps: true });

/**
 * INDEXES
 */
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });

/**
 * VIRTUAL: ITEM COUNT
 */
orderSchema.virtual('itemCount').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * VIRTUAL: STATUS BADGE
 */
orderSchema.virtual('statusLabel').get(function () {
    const labels = {
        pending: 'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        processing: 'Đang xử lý',
        shipped: 'Đã gửi hàng',
        delivered: 'Đã giao hàng',
        cancelled: 'Đã hủy',
        refunded: 'Đã hoàn tiền'
    };
    return labels[this.status] || this.status;
});

/**
 * METHOD: CALCULATE TOTAL
 */
orderSchema.methods.calculateTotal = function () {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.total = this.subtotal + this.shippingFee + this.tax - this.discount;
    return this.total;
};

/**
 * METHOD: CANCEL ORDER
 */
orderSchema.methods.cancel = function () {
    if (['pending', 'confirmed', 'processing'].includes(this.status)) {
        this.status = 'cancelled';
        this.cancelledAt = new Date();
        return true;
    }
    return false;
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
