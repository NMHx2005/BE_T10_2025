import express from 'express';
import { renderProfilePage } from '../../../controllers/client/profile.controller.js';


const router = express.Router();


router.get('/', renderProfilePage);


export default router;