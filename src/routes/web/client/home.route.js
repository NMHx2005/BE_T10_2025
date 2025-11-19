import express from 'express';
import { renderHomePage } from '../../../controllers/client/homeController.js';

const router = express.Router();

router.get("/", renderHomePage);


export default router;