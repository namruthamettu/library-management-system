
const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
    {
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: [true, 'Reservation requires a referenced book']
        },

        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Reservation requires a referenced member']
        },

        reservedAt: {
            type: Date,
            default: Date.now,
            required: true
        },

        expiresAt: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: {
                values: [
                    'pending',
                    'available',
                    'fulfilled',
                    'cancelled',
                    'expired'
                ],
                message: 'Invalid reservation status'
            },
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

// Reservation validations
reservationSchema.pre('validate', function () {
    if (
        this.expiresAt &&
        this.reservedAt &&
        this.expiresAt <= this.reservedAt
    ) {
        this.invalidate(
            'expiresAt',
            'Expiry date must be later than reservation date'
        );
    }

    if (this.status === 'available' && !this.expiresAt) {
        this.invalidate(
            'expiresAt',
            'Available reservations must have an expiry date'
        );
    }

    if (this.status === 'fulfilled' && this.expiresAt) {
        this.invalidate(
            'expiresAt',
            'Fulfilled reservations should not have an expiry date'
        );
    }
});

// Indexes for FIFO queue and reservation lookups
reservationSchema.index({ book: 1, status: 1, reservedAt: 1 });
reservationSchema.index({ member: 1, status: 1 });
reservationSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
