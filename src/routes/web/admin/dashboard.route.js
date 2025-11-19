import express from 'express';
import { renderAdminDashboard } from '../../../controllers/admin/dashboard.controllers.js';

const router = express.Router();

router.get("/", renderAdminDashboard);


export default router;