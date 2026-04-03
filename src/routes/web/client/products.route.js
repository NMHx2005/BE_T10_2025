import express from 'express';
import { renderProductsPage } from '../../../controllers/client/productPage.controller.js';

const router = express.Router();

router.get('/', renderProductsPage);

export default router;
