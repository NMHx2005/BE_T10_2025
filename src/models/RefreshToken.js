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
    userAgent: {
        type: String,
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    revokedAt: {
        type: Date,
    }
}, {
    timestamps: true
})



const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;