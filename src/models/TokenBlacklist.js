import mongoose from "mongoose";
import { token } from "morgan";

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    tokenType: {
        type: String,
        required: true,
        enum: ['access', 'refresh'],
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
    revokedAt: {
        type: Date,
        default: Date.now
    },
    reason: {
        type: String,
        enum: ['logout', 'password_change', 'admin_revoke', 'security_breach'],
        default: 'logout'
    }
},
    {
        timestamps: true
    }
);

// Tối ưu truy vấn
tokenBlacklistSchema.index({ userId: 1, tokenType: 1 });
tokenBlacklistSchema.index({ token: 1 });

// add to blacklist
tokenBlacklistSchema.statics.addToBlackList = async function (token, tokenType, userId, expiresAt, reason = 'logout') {
    try {
        const blacklistedToken = new this({
            token,
            tokenType,
            userId,
            expiresAt,
            reason
        });
        return await blacklistedToken.save();
    } catch (error) {
        // nếu token đã có trong blacklist, không cần tạo lại
        if (error.code === 11000) {
            return null;
        }
        throw error;
    }
}
// is blacklisted
tokenBlacklistSchema.statics.isBlacklisted = async function (token) {
    const tokenEntry = await this.findOne({ token });
    return !!tokenEntry;
}

// revoke all user tokens
tokenBlacklistSchema.statics.revokeUserTokens = async function (userId, reason = 'security_breach') {
    return true;
}
// cleanup expired tokens
tokenBlacklistSchema.statics.cleanupExpired = async function () {
    const result = await this.deleteMany({
        expiresAt: { $lt: new Date() }
    });
    return result;
}

const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

export default TokenBlacklist;

