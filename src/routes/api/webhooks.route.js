import express from 'express';
import { payosWebhookHandler } from '../../controllers/client/order.controller.js';

const router = express.Router();

router.post('/payos', payosWebhookHandler);

export default router;
