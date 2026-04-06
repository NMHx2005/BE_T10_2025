import express from 'express';
import {
    getForgotPasswordPage,
    getLoginPage,
    getLogoutPage,
    getRegisterPage,
    getResetPasswordPage,
} from '../../../controllers/client/auth.controllers.js';


const router = express.Router();


router.get('/login', getLoginPage)

router.get('/register', getRegisterPage);
router.get('/forgot-password', getForgotPasswordPage);
router.get('/reset-password/:token', getResetPasswordPage);

router.get('/logout', getLogoutPage);


export default router;