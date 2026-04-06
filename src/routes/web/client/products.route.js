import express from 'express';
import {
    renderProductDetailPage,
    renderProductsPage,
} from '../../../controllers/client/productPage.controller.js';

const router = express.Router();

router.get('/', renderProductsPage);
router.get('/:id', renderProductDetailPage);

export default router;
