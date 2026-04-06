import express from 'express';
import { getAllUsers, getUserDetail } from '../../../controllers/admin/page.controllers.js';

const router = express.Router();

// User list and detail
router.get('/', getAllUsers);
router.get('/:id', getUserDetail);

export default router;