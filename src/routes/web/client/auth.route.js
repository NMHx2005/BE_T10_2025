import express from 'express';
import { getLoginPage, getLogoutPage, getRegisterPage } from '../../../controllers/client/auth.controllers.js';


const router = express.Router();


router.get('/login', getLoginPage)

router.get('/register', getRegisterPage);

router.get('/logout', getLogoutPage);


export default router;