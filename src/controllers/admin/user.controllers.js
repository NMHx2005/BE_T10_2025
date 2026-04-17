import mongoose from 'mongoose';
import User from '../../models/User.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

async function countActiveAdmins() {
    return User.countDocuments({ role: 'admin', status: 'active' });
}

/**
 * GET /api/v1/users — Admin: danh sách user (JSON)
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;
        const { search, role, status } = req.query;

        const filter = {};
        if (search && String(search).trim()) {
            const q = String(search).trim();
            filter.$or = [
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
            ];
        }
        if (role) filter.role = role;
        if (status) filter.status = status;

        const [users, total] = await Promise.all([
            User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            User.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách người dùng thành công',
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/users/:id — Admin cập nhật user
 */
export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ValidationError('ID không hợp lệ');
        }

        const { username, phone, role, status, avatar } = req.body;
        const user = await User.findById(id);
        if (!user) {
            throw new NotFoundError('Người dùng không tồn tại');
        }

        if (username !== undefined) {
            const u = String(username).trim();
            if (u.length < 3) {
                throw new ValidationError('Username tối thiểu 3 ký tự');
            }
            user.username = u;
        }

        if (phone !== undefined) {
            const p = String(phone).trim();
            if (p === '') {
                user.set('phone', undefined);
            } else {
                user.phone = p;
            }
        }

        if (role !== undefined) {
            if (!['user', 'admin'].includes(role)) {
                throw new ValidationError('Role không hợp lệ');
            }
            if (req.user._id.toString() === id && role !== user.role) {
                throw new ValidationError(
                    'Không thể đổi vai trò của chính bạn. Nhờ một admin khác thực hiện.',
                );
            }
            if (user.role === 'admin' && role === 'user' && user.status === 'active') {
                const admins = await countActiveAdmins();
                if (admins <= 1) {
                    throw new ValidationError(
                        'Phải có ít nhất một tài khoản admin đang hoạt động.',
                    );
                }
            }
            user.role = role;
        }

        if (status !== undefined) {
            if (!['active', 'inactive'].includes(status)) {
                throw new ValidationError('Trạng thái không hợp lệ');
            }
            if (status === 'inactive' && req.user._id.toString() === id) {
                throw new ValidationError(
                    'Không thể tự vô hiệu hóa tài khoản đang đăng nhập.',
                );
            }
            if (
                status === 'inactive' &&
                user.role === 'admin' &&
                user.status === 'active'
            ) {
                const admins = await countActiveAdmins();
                if (admins <= 1) {
                    throw new ValidationError(
                        'Không thể vô hiệu hóa admin duy nhất đang hoạt động.',
                    );
                }
            }
            user.status = status;
        }

        if (avatar !== undefined && typeof avatar === 'string') {
            const a = avatar.trim();
            if (a) {
                user.avatar = a;
            }
        }

        await user.save();

        const updated = await User.findById(id).select('-password').lean();
        res.status(200).json({
            success: true,
            message: 'Cập nhật người dùng thành công',
            data: updated,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/users/:id — Admin vô hiệu hóa user (soft: status = inactive, không xóa document)
 */
export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ValidationError('ID không hợp lệ');
        }

        if (req.user._id.toString() === id) {
            throw new ValidationError('Không thể vô hiệu hóa tài khoản đang đăng nhập');
        }

        const user = await User.findById(id);
        if (!user) {
            throw new NotFoundError('Người dùng không tồn tại');
        }

        if (user.status === 'inactive') {
            res.status(200).json({
                success: true,
                message: 'Tài khoản đã ở trạng thái inactive',
            });
            return;
        }

        if (user.role === 'admin') {
            const admins = await countActiveAdmins();
            if (admins <= 1) {
                throw new ValidationError(
                    'Không thể vô hiệu hóa admin duy nhất đang hoạt động.',
                );
            }
        }

        user.status = 'inactive';
        await user.save();

        const out = await User.findById(id).select('-password').lean();
        res.status(200).json({
            success: true,
            message: 'Đã vô hiệu hóa tài khoản (soft delete)',
            data: out,
        });
    } catch (error) {
        next(error);
    }
};
