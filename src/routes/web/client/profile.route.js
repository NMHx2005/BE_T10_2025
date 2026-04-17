import express from 'express';
import {
    renderProfilePage,
    renderAddressesPage,
    renderOrdersPage,
    renderProfileOrderDetailPage,
    renderSettingsPage,
} from '../../../controllers/client/profile.controller.js';


const router = express.Router();


router.get('/', renderProfilePage);
router.get('/addresses', renderAddressesPage);
router.get('/orders', renderOrdersPage);
router.get('/orders/:id', renderProfileOrderDetailPage);
router.get('/settings', renderSettingsPage);
router.get('/settings/password', (req, res) => {
    res.redirect(302, '/profile/settings#mat-khau');
});


export default router;