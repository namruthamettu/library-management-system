
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide category name'],
            unique: true,
            trim: true,
            maxlength: [100, 'Category name cannot exceed 100 characters'],
            lowercase: true
        },

        description: {
            type: String,
            trim: true,
            default: '',
            maxlength: [500, 'Description cannot exceed 500 characters']
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Category', categorySchema);
