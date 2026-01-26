import express from 'express';
import { getProfile, updateProfile, uploadAvatar as uploadAvatarController } from '../../controllers/client/user.controllers.js';
import { adminOnly, protect } from '../../middleware/auth.js';
import { deleteUser, getAllUsers, updateUser } from '../../controllers/admin/user.controllers.js';
import { updateProfileValidation } from '../../middleware/validators/auth.validator.js';
import { uploadAvatar } from '../../middleware/upload.js';


const router = express.Router();

// GET /api/v1/users/profile - Lấy thông tin người dùng
router.get('/profile', protect, getProfile);

// Cập nhật profile  /api/v1/users/profile
router.put('/profile', protect, updateProfileValidation);

// /upload-avatar
router.post('/upload-avatar', protect, uploadAvatar, uploadAvatarController);
// change-password
// address
// post address
// put address/:id
// delete address/:id


// middleware protect sẽ kiểm tra auth trước khi vào controller


// Admin
// Lấy ra tất cả người dùng
router.get('/', protect, adminOnly, getAllUsers);

// Cập nhật user
router.put('/:id', protect, adminOnly, updateUser);


// Xóa user
router.delete('/:id', protect, adminOnly, deleteUser);







export default router;