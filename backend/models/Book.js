
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please provide book title'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters']
        },

        author: {
            type: String,
            required: [true, 'Please provide author name'],
            trim: true,
            maxlength: [150, 'Author cannot exceed 150 characters']
        },

        isbn: {
            type: String,
            required: [true, 'Please provide ISBN'],
            unique: true,
            trim: true,
            uppercase: true,
            match: [
                /^(?:\d{9}[\dX]|\d{13}|\d{3}-\d{10,13})$/,
                'Please provide a valid ISBN format'
            ]
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Please specify a category']
        },

        publisher: {
            type: String,
            required: [true, 'Please provide publisher name'],
            trim: true,
            maxlength: [150, 'Publisher cannot exceed 150 characters']
        },

        publishedYear: {
            type: Number,
            required: [true, 'Please provide published year'],
            min: [1000, 'Published year must be after 1000'],
            max: [
                new Date().getFullYear() + 1,
                'Published year cannot be in the future'
            ],
            validate: {
                validator: Number.isInteger,
                message: 'Published year must be a whole number'
            }
        },

        totalCopies: {
            type: Number,
            required: [true, 'Please provide total copies'],
            min: [1, 'Total copies must be at least 1'],
            validate: {
                validator: Number.isInteger,
                message: 'Total copies must be a whole number'
            }
        },

        availableCopies: {
            type: Number,
            required: [true, 'Please provide available copies'],
            min: [0, 'Available copies cannot be negative'],
            validate: {
                validator: Number.isInteger,
                message: 'Available copies must be a whole number'
            }
        },

        coverImage: {
            type: String,
            default: ''
        },

        shelfLocation: {
            type: String,
            required: [true, 'Please provide shelf location'],
            trim: true,
            maxlength: [100, 'Shelf location cannot exceed 100 characters']
        }
    },
    {
        timestamps: true
    }
);

// Validate available copies against total copies
bookSchema.pre('validate', function () {
    if (this.availableCopies > this.totalCopies) {
        this.invalidate(
            'availableCopies',
            'Available copies cannot exceed total copies'
        );
    }
});

// Indexes
bookSchema.index({ title: 'text', author: 'text', publisher: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ availableCopies: 1 });

module.exports = mongoose.model('Book', bookSchema);
