import express from 'express';
import { protect, adminOnly } from '../../middleware/auth.js';
import { uploadProductImage } from '../../middleware/upload.js';
import { uploadProductImageController } from '../../controllers/upload.controller.js';

const router = express.Router();

router.post(
    '/product-image',
    protect,
    adminOnly,
    uploadProductImage,
    uploadProductImageController
);

export default router;
