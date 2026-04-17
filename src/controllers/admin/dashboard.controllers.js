import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import AuditLog from '../../models/AuditLog.js';
import User from '../../models/User.js';

const LOW_STOCK_MAX = 10;
const REVENUE_EXCLUDE_STATUSES = ['cancelled', 'refunded'];

/** Sản phẩm đang bán (active, không nháp) */
const productListedFilter = {
    status: 'active',
};

function vnDateKey(d) {
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function formatRelativeTime(date) {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'Vừa xong';
    if (sec < 3600) return `${Math.floor(sec / 60)} phút trước`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} giờ trước`;
    if (sec < 604800) return `${Math.floor(sec / 86400)} ngày trước`;
    return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function auditActionLabel(action) {
    const map = {
        PRODUCT_UPDATE: 'Cập nhật sản phẩm',
        PRODUCT_SOFT_DELETE: 'Xóa mềm sản phẩm',
        PRODUCT_RESTORE: 'Khôi phục sản phẩm',
    };
    return map[action] || action || 'Hoạt động';
}

const totalActiveStockExpr = {
    $reduce: {
        input: {
            $filter: {
                input: { $ifNull: ['$variants', []] },
                as: 'v',
                cond: { $eq: ['$$v.isActive', true] },
            },
        },
        initialValue: 0,
        in: { $add: ['$$value', '$$this.stock'] },
    },
};

function buildActivityFeed(auditLogs, orders, newUsers, max = 12) {
    const rows = [];

    for (const a of auditLogs) {
        const actor = a.actorId;
        const actorLabel =
            actor && typeof actor === 'object'
                ? actor.username || actor.email || ''
                : '';
        rows.push({
            at: a.createdAt,
            rel: formatRelativeTime(a.createdAt),
            title: auditActionLabel(a.action),
            subtitle: [a.entity, actorLabel].filter(Boolean).join(' · '),
            icon: 'fa-clock-rotate-left',
            chipClass: 'bg-[#fff2e6] text-[#f48525]',
        });
    }

    for (const o of orders) {
        rows.push({
            at: o.createdAt,
            rel: formatRelativeTime(o.createdAt),
            title: `Đơn ${o.orderNumber || o._id}`,
            subtitle: `${o.status} · ${Number(o.total || 0).toLocaleString('vi-VN')} ₫`,
            icon: 'fa-receipt',
            chipClass: 'bg-[#edf7ff] text-[#1d70b8]',
        });
    }

    for (const u of newUsers) {
        rows.push({
            at: u.createdAt,
            rel: formatRelativeTime(u.createdAt),
            title: 'Đăng ký mới',
            subtitle: u.username || u.email || '',
            icon: 'fa-user-plus',
            chipClass: 'bg-[#eefbf3] text-[#0f9f53]',
        });
    }

    rows.sort((x, y) => new Date(y.at) - new Date(x.at));
    return rows.slice(0, max);
}

export const renderAdminDashboard = async (req, res) => {
    try {
        const now = new Date();
        const start30 = new Date(now);
        start30.setDate(start30.getDate() - 29);
        start30.setHours(0, 0, 0, 0);

        const [
            activeProducts,
            orderStatusCounts,
            revenue30Agg,
            dailyRevenue,
            lowStockProducts,
            lowStockCountAgg,
            recentAudit,
            recentOrders,
            recentUsers,
        ] = await Promise.all([
            Product.countDocuments(productListedFilter),
            Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start30 },
                        status: { $nin: REVENUE_EXCLUDE_STATUSES },
                    },
                },
                { $group: { _id: null, total: { $sum: '$total' } } },
            ]),
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start30 },
                        status: { $nin: REVENUE_EXCLUDE_STATUSES },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt',
                                timezone: 'Asia/Ho_Chi_Minh',
                            },
                        },
                        revenue: { $sum: '$total' },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Product.aggregate([
                { $match: productListedFilter },
                { $addFields: { totalStock: totalActiveStockExpr } },
                {
                    $match: {
                        totalStock: { $lte: LOW_STOCK_MAX, $gte: 0 },
                    },
                },
                { $sort: { totalStock: 1 } },
                { $limit: 10 },
                {
                    $project: {
                        name: 1,
                        slug: 1,
                        totalStock: 1,
                    },
                },
            ]),
            Product.aggregate([
                { $match: productListedFilter },
                { $addFields: { totalStock: totalActiveStockExpr } },
                { $match: { totalStock: { $lte: LOW_STOCK_MAX } } },
                { $count: 'n' },
            ]),
            AuditLog.find()
                .sort({ createdAt: -1 })
                .limit(15)
                .populate('actorId', 'username email')
                .lean(),
            Order.find()
                .sort({ createdAt: -1 })
                .limit(12)
                .select('orderNumber total status createdAt')
                .lean(),
            User.find()
                .sort({ createdAt: -1 })
                .limit(8)
                .select('username email createdAt')
                .lean(),
        ]);

        const revenue30 = revenue30Agg[0]?.total || 0;
        const orderByStatus = Object.fromEntries(
            orderStatusCounts.map((r) => [r._id, r.count]),
        );
        const totalOrders = orderStatusCounts.reduce((s, r) => s + r.count, 0);
        const ordersInProgress =
            (orderByStatus.pending || 0) +
            (orderByStatus.confirmed || 0) +
            (orderByStatus.processing || 0) +
            (orderByStatus.shipped || 0);

        const dailyMap = Object.fromEntries(
            dailyRevenue.map((d) => [d._id, d.revenue]),
        );

        const chartLabels30 = [];
        const chartValues30 = [];
        for (let i = 29; i >= 0; i -= 1) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = vnDateKey(d);
            chartLabels30.push(
                d.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    timeZone: 'Asia/Ho_Chi_Minh',
                }),
            );
            chartValues30.push(dailyMap[key] || 0);
        }

        const revenue7 = chartValues30
            .slice(-7)
            .reduce((a, b) => a + b, 0);

        const lowStockCount = lowStockCountAgg[0]?.n ?? 0;

        const activities = buildActivityFeed(
            recentAudit,
            recentOrders,
            recentUsers,
            12,
        );

        res.render('pages/admin/dashboard', {
            title: 'Tổng quan',
            stats: {
                activeProducts,
                totalOrders,
                ordersInProgress,
                orderByStatus,
                revenue30,
                revenue7,
                lowStockCount,
                lowStockThreshold: LOW_STOCK_MAX,
            },
            lowStockProducts,
            chartLabels30,
            chartValues30,
            activities,
        });
    } catch (error) {
        console.error('renderAdminDashboard:', error);
        res.status(500).render('404', { title: 'Lỗi', error: error.message });
    }
};
