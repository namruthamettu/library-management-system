const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Transaction requires a referenced book'],
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction requires a referenced member'],
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction requires the issuing librarian ID'],
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Transaction requires a due date'],
    },
    returnDate: {
      type: Date,
      default: null,
    },
    renewCount: {
      type: Number,
      default: 0,
      max: [1, 'A book loan can only be renewed once'],
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: [0, 'Fine amount cannot be negative'],
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: {
        values: ['issued', 'returned', 'overdue'],
        message: 'Status must be issued, returned, or overdue',
      },
      default: 'issued',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast dashboard and report aggregation
transactionSchema.index({ member: 1, status: 1 });
transactionSchema.index({ book: 1, status: 1 });
transactionSchema.index({ status: 1, dueDate: 1 });
transactionSchema.index({ issueDate: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
