import express from 'express';
import {
    renderCartPage,
    renderCheckoutPage,
    renderWishlistPage,
    renderOrderTrackingPage,
    renderPayosReturnPage,
    renderPayosCancelPage,
} from '../../../controllers/client/shop.controller.js';

const router = express.Router();

router.get('/cart', renderCartPage);
router.get('/checkout', renderCheckoutPage);
router.get('/wishlist', renderWishlistPage);
router.get('/order-tracking', renderOrderTrackingPage);
router.get('/checkout/payos/return', renderPayosReturnPage);
router.get('/checkout/payos/cancel', renderPayosCancelPage);
// Alias (PayOS / cấu hình cũ hay dùng /payment/...)
router.get('/payment/payos/return', renderPayosReturnPage);
router.get('/payment/payos/cancel', renderPayosCancelPage);

export default router;
