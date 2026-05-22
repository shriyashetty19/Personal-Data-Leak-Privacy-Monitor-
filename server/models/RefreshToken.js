import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    expires: {
        type: Date,
        required: true
    },
    revoked: {
        type: Boolean,
        default: false
    },
    replacedByToken: {
        type: String
    }
}, { timestamps: true });

// Check if token is expired
refreshTokenSchema.virtual('isExpired').get(function () {
    return Date.now() >= this.expires;
});

// Check if token is active
refreshTokenSchema.virtual('isActive').get(function () {
    return !this.revoked && !this.isExpired;
});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
