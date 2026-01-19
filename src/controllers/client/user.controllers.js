import User from "../../models/User.js";
import { NotFoundError } from "../../utils/errors.js";

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

export { getProfile, updateProfile };