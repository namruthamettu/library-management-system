
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
    {
        loanPeriodDays: {
            type: Number,
            required: [true, 'Loan period days is required'],
            default: 14,
            min: [1, 'Loan period must be at least 1 day'],
            max: [90, 'Loan period cannot exceed 90 days'],
            validate: {
                validator: Number.isInteger,
                message: 'Loan period must be a whole number'
            }
        },

        finePerDay: {
            type: Number,
            required: [true, 'Fine per day is required'],
            default: 5,
            min: [0, 'Fine per day cannot be negative'],
            validate: {
                validator: Number.isFinite,
                message: 'Fine per day must be a valid number'
            }
        },

        maxBooksPerMember: {
            type: Number,
            required: [true, 'Maximum books per member is required'],
            default: 3,
            min: [1, 'Maximum books must be at least 1'],
            max: [20, 'Maximum books cannot exceed 20'],
            validate: {
                validator: Number.isInteger,
                message: 'Maximum books must be a whole number'
            }
        },

        maxUnpaidFine: {
            type: Number,
            required: [true, 'Maximum unpaid fine threshold is required'],
            default: 100,
            min: [0, 'Threshold cannot be negative'],
            validate: {
                validator: Number.isFinite,
                message: 'Maximum unpaid fine must be a valid number'
            }
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Retrieve existing settings or create defaults
settingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();

    if (!settings) {
        settings = await this.create({
            loanPeriodDays: 14,
            finePerDay: 5,
            maxBooksPerMember: 3,
            maxUnpaidFine: 100
        });
    }

    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
