export const renderCartPage = (req, res) => {
    res.render('pages/client/cart', {
        title: 'Giỏ hàng — PRO-TOOLS',
    });
};

export const renderCheckoutPage = (req, res) => {
    res.render('pages/client/checkout', {
        title: 'Thanh toán — PRO-TOOLS',
    });
};

export const renderWishlistPage = (req, res) => {
    res.render('pages/client/wishlist', {
        title: 'Yêu thích — PRO-TOOLS',
    });
};

export const renderOrderTrackingPage = (req, res) => {
    res.render('pages/client/order-tracking', {
        title: 'Tra cứu đơn hàng — PRO-TOOLS',
    });
};

export const renderPayosReturnPage = (req, res) => {
    res.render('pages/client/checkout-payos-return', {
        title: 'Kết quả thanh toán — PRO-TOOLS',
        orderId: req.query.orderId || '',
    });
};

export const renderPayosCancelPage = (req, res) => {
    res.render('pages/client/checkout-payos-cancel', {
        title: 'Thanh toán đã hủy — PRO-TOOLS',
        orderId: req.query.orderId || '',
    });
};
