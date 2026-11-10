
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Notification requires a recipient']
        },

        title: {
            type: String,
            required: [true, 'Notification requires a title'],
            trim: true,
            maxlength: [120, 'Title cannot exceed 120 characters']
        },

        message: {
            type: String,
            required: [true, 'Notification requires a message'],
            trim: true,
            maxlength: [500, 'Message cannot exceed 500 characters']
        },

        type: {
            type: String,
            enum: {
                values: [
                    'due_reminder',
                    'overdue',
                    'reservation_available',
                    'reservation_expired',
                    'fine_paid',
                    'general'
                ],
                message: 'Invalid notification type'
            },
            default: 'general'
        },

        isRead: {
            type: Boolean,
            default: false
        },

        link: {
            type: String,
            default: '',
            trim: true,
            maxlength: [500, 'Notification link cannot exceed 500 characters']
        }
    },
    {
        timestamps: true
    }
);

// Index for notification retrieval
notificationSchema.index({
    recipient: 1,
    isRead: 1,
    createdAt: -1
});

module.exports = mongoose.model('Notification', notificationSchema);
