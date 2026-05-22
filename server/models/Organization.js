import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    inviteTokens: [{
        token: String,
        email: String,
        role: String,
        expiresAt: Date
    }],
    monitoredEmails: [{
        type: String,
        lowercase: true
    }],
    monitoredDomains: [{
        type: String,
        lowercase: true
    }]
}, { timestamps: true });

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;
