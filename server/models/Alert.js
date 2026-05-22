import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    breachName: {
        type: String,
        required: true
    },
    date: {
        type: Date
    },
    compromisedData: [{
        type: String
    }],
    description: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
