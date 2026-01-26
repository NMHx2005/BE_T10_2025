import { uploadImageToCloudinary } from "../../config/cloudinary.js";
import User from "../../models/User.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";

const getProfile = async (req, res, next) => {
    try {
        const userId = await req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User Không tồn tại');
        }
        res.status(200).json({
            success: true,
            data: {
                user: user
            }
        })
    } catch (error) {
        next(error);
    }
}


const updateProfile = async (req, res, next) => {
    const userId = req.user._id;
    const { username, avatar } = req.body;
    const user = await User.findById(userId);
    if (!user) {
        throw new NotFoundError("User không tồn tại");
    }
    if (username) user.username = username;
    if (avatar) user.avatar = avatar;
    await user.save();
    res.status(200).json({
        success: true,
        message: 'Cập nhật profile thành công',
        data: {
            user: user
        }
    })
}

const uploadAvatar = async (req, res, next) => {
    try {
        // B1: Kiểm tra xem file đã được upload chưa: req.body.avatar
        if (!req.file) {
            throw new ValidationError('Vui lòng chọn file ảnh')
        }

        // B2: Lấy ra user id
        const userId = req.user._id;

        // B3: Tìm user trong db
        const user = await User.findById(userId);

        if (!user) {
            throw new NotFoundError('User không tồn tại');
        }

        // B4: Xóa avatar cũ nếu có (nếu có)

        // B5: Upload ảnh lên cloudinary
        const uploadResult = await uploadImageToCloudinary(req.file.buffer, 'avatars');


        // B6: Cập nhật avatar trong db
        user.avatar = uploadResult.url;
        // public_id dùng để xóa ảnh trên cloudinary
        await user.save();

        // B7: Response
        res.status(200).json({
            success: true,
            message: 'Upload avatar thành công',
            data: {
                avatar: user.avatar
            }
        })
    } catch (error) {
        next(error);
    }
}

export { getProfile, updateProfile, uploadAvatar };