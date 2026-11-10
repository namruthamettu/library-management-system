
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        // User's full name
        name: {
            type: String,
            required: [true, 'Please provide full name'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters']
        },

        // Email address
        email: {
            type: String,
            required: [true, 'Please provide an email address'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                'Please provide a valid email address'
            ]
        },

        // User password
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false
        },

        // User role
        role: {
            type: String,
            enum: {
                values: ['admin', 'librarian', 'member'],
                message: 'Role must be admin, librarian, or member'
            },
            default: 'member'
        },

        // Unique library member ID
        memberId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
            default: undefined
        },

        // Contact number
        phone: {
            type: String,
            trim: true,
            default: ''
        },

        // Account activation status
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

// Export User model
module.exports = mongoose.model('User', userSchema);
