// revoke token
import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expiresAfterSeconds: 0 } // TTL index để tự động xóa tài liệu khi hết hạn
    },
    userAgent: {
        type: String,
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    revokedAt: {
        type: Date,
    },
    revokedReason: {
        type: String,
        enum: ['logout', 'password_change', 'admin_revoke', 'security_breach'],
    }
}, {
    timestamps: true
})

refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

refreshTokenSchema.statics.revokeToken = async function (token, reason = 'logout') {
    return this.findOneAndUpdate({ token: token }, {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason
    }, { new: true });
}

refreshTokenSchema.statics.revokeAllUserTokens = async function (userId, reason = 'logout') {
    return this.updateMany({ userId: userId, isRevoked: false }, {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason
    });
}

refreshTokenSchema.statics.isTokenRevoked = async function (token) {
    const tokenDoc = await this.findOne({ token: token });
    if (!tokenDoc) {
        return true; // Token không tồn tại, coi như đã bị thu hồi
    }
    if (tokenDoc.isRevoked) {
        return true; // Token đã bị thu hồi
    }

    if (new Date() > tokenDoc.expiresAt) {
        return true; // Token đã hết hạn
    }

    return true;
}


refreshTokenSchema.statics.createToken = async function (token, userId, expiresAt, userAgent = '') {
    return this.create({
        token,
        userId,
        expiresAt,
        userAgent
    });
}
const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;