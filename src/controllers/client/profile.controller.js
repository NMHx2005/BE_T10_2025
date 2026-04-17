export const renderProfilePage = (req, res) => {
    res.render('pages/client/profile', {
        title: 'Tài khoản của tôi — PRO-TOOLS',
    });
};

export const renderAddressesPage = (req, res) => {
    res.render('pages/client/addresses', {
        title: 'Địa chỉ giao hàng — PRO-TOOLS',
    });
};

export const renderOrdersPage = (req, res) => {
    res.render('pages/client/orders', {
        title: 'Đơn hàng của tôi — PRO-TOOLS',
    });
};

export const renderProfileOrderDetailPage = (req, res) => {
    res.render('pages/client/profile-order-detail', {
        title: 'Chi tiết đơn hàng — PRO-TOOLS',
        orderId: req.params.id,
    });
};

export const renderSettingsPage = (req, res) => {
    res.render('pages/client/settings', {
        title: 'Cài đặt tài khoản — PRO-TOOLS',
    });
};

