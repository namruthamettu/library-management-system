const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Reservation = require('../models/Reservation');
const Notification = require('../models/Notification');

/**
 * @desc    Issue a book to a member
 * @route   POST /api/transactions/issue
 * @access  Private (Admin & Librarian)
 */
const issueBook = async (req, res, next) => {
  try {
    const { bookId, memberId } = req.body;

    if (!bookId || !memberId) {
      return res.status(400).json({
        success: false,
        message: 'Both bookId and memberId are required to issue a book.',
      });
    }

    // 1. Fetch System Settings
    const settings = await Settings.getSettings();

    // 2. Fetch Member
    // Support lookup by MongoDB _id or institutional memberId (e.g. MEM-10001)
    let member;
    if (mongoose.Types.ObjectId.isValid(memberId)) {
      member = await User.findById(memberId);
    }
    if (!member) {
      member = await User.findOne({ memberId: memberId.trim() });
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found. Please verify the member ID.',
      });
    }

    if (!member.isActive) {
      return res.status(403).json({
        success: false,
        message: `Member account (${member.name}) is inactive/deactivated. Cannot issue books.`,
      });
    }

    // 3. Fetch Book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found in library catalog.',
      });
    }

    // 4. Verify book is not already issued to this same member and unreturned
    const existingActiveLoan = await Transaction.findOne({
      book: book._id,
      member: member._id,
      status: { $in: ['issued', 'overdue'] },
    });

    if (existingActiveLoan) {
      return res.status(400).json({
        success: false,
        message: `Member '${member.name}' already has an active borrowed copy of '${book.title}'.`,
      });
    }

    // 5. Verify Member Borrowing Limit
    const activeLoansCount = await Transaction.countDocuments({
      member: member._id,
      status: { $in: ['issued', 'overdue'] },
    });

    if (activeLoansCount >= settings.maxBooksPerMember) {
      return res.status(400).json({
        success: false,
        message: `Borrowing limit reached. Member '${member.name}' already has ${activeLoansCount} active book loans (Limit: ${settings.maxBooksPerMember}).`,
      });
    }

    // 6. Verify Unpaid Fines Limit
    const unpaidTransactions = await Transaction.find({
      member: member._id,
      finePaid: false,
      fineAmount: { $gt: 0 },
    });

    const totalUnpaidFine = unpaidTransactions.reduce((acc, curr) => acc + curr.fineAmount, 0);

    if (totalUnpaidFine > settings.maxUnpaidFine) {
      return res.status(400).json({
        success: false,
        message: `Issue blocked: Member '${member.name}' has accumulated ₹${totalUnpaidFine} in unpaid fines, exceeding the threshold of ₹${settings.maxUnpaidFine}. Please clear outstanding fines first.`,
      });
    }

    // 7. Check if this member had an active 'available' reservation for this book
    const memberReservation = await Reservation.findOne({
      book: book._id,
      member: member._id,
      status: 'available',
    });

    // 8. Verify Book Availability
    if (!memberReservation && book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: `No available copies for '${book.title}'. All ${book.totalCopies} copies are currently checked out or reserved.`,
      });
    }

    // Calculate Due Date
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + settings.loanPeriodDays);

    // Create Transaction
    const transaction = await Transaction.create({
      book: book._id,
      member: member._id,
      issuedBy: req.user._id,
      issueDate,
      dueDate,
      renewCount: 0,
      fineAmount: 0,
      finePaid: false,
      status: 'issued',
    });

    // If fulfilling a reservation held for this member, mark reservation fulfilled
    if (memberReservation) {
      memberReservation.status = 'fulfilled';
      await memberReservation.save();
    } else {
      // Decrement available copies
      book.availableCopies = Math.max(0, book.availableCopies - 1);
      await book.save();
    }

    // Create In-App Notification for Member
    await Notification.create({
      recipient: member._id,
      title: 'Book Issued',
      message: `You have borrowed '${book.title}'. It is due on ${dueDate.toLocaleDateString()}.`,
      type: 'general',
      link: '/member/borrowed',
    });

    const populatedTx = await Transaction.findById(transaction._id)
      .populate('book', 'title author isbn coverImage shelfLocation')
      .populate('member', 'name email memberId phone')
      .populate('issuedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: `Book '${book.title}' successfully issued to ${member.name}.`,
      transaction: populatedTx,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept return of a borrowed book
 * @route   PUT /api/transactions/:id/return
 * @access  Private (Admin & Librarian)
 */
const returnBook = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('book')
      .populate('member', 'name email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction record not found.',
      });
    }

    if (transaction.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'This book has already been returned.',
      });
    }

    const settings = await Settings.getSettings();
    const returnDate = new Date();
    transaction.returnDate = returnDate;

    // Calculate overdue days and fine
    let overdueDays = 0;
    let fineAmount = 0;

    if (returnDate > transaction.dueDate) {
      const diffTime = returnDate.getTime() - new Date(transaction.dueDate).getTime();
      overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = overdueDays * settings.finePerDay;
    }

    transaction.fineAmount = fineAmount;
    // If optional finePaid flag sent by librarian when collecting fee at desk
    if (req.body.finePaid !== undefined) {
      transaction.finePaid = Boolean(req.body.finePaid);
    } else if (fineAmount === 0) {
      transaction.finePaid = true;
    }

    transaction.status = 'returned';
    await transaction.save();

    const book = await Book.findById(transaction.book._id);

    // Process Reservation Queue (First-Come First-Served)
    const nextReservation = await Reservation.findOne({
      book: book._id,
      status: 'pending',
    }).sort({ reservedAt: 1 });

    let reservationNotified = null;

    if (nextReservation) {
      // Hold copy for reserved member for 48 hours (2 days)
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 48);

      nextReservation.status = 'available';
      nextReservation.expiresAt = expiryDate;
      await nextReservation.save();

      // Notify the reserving member
      await Notification.create({
        recipient: nextReservation.member,
        title: 'Reserved Book Ready for Collection',
        message: `Your reserved book '${book.title}' is now available for collection at the library counter. Please collect it before ${expiryDate.toLocaleDateString()} (${expiryDate.toLocaleTimeString()}).`,
        type: 'reservation_available',
        link: '/member/reservations',
      });

      reservationNotified = {
        memberId: nextReservation.member,
        expiresAt: expiryDate,
      };
    } else {
      // No reservation waiting: return copy to public available stock
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      await book.save();
    }

    // In-app notification to returning member
    let returnMessage = `Book '${book.title}' return processed successfully.`;
    if (fineAmount > 0) {
      returnMessage += ` Overdue by ${overdueDays} day(s). Fine assessed: ₹${fineAmount}.`;
    }

    await Notification.create({
      recipient: transaction.member._id,
      title: 'Book Return Processed',
      message: returnMessage,
      type: fineAmount > 0 ? 'overdue' : 'general',
      link: '/member/history',
    });

    const populatedTx = await Transaction.findById(transaction._id)
      .populate('book', 'title author isbn coverImage shelfLocation')
      .populate('member', 'name email memberId phone')
      .populate('issuedBy', 'name email');

    res.json({
      success: true,
      message: `Book '${book.title}' returned successfully.${fineAmount > 0 ? ` Overdue fine: ₹${fineAmount}.` : ''}`,
      overdueDays,
      fineAmount,
      finePaid: transaction.finePaid,
      reservationNotified,
      transaction: populatedTx,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Renew a borrowed book
 * @route   PUT /api/transactions/:id/renew
 * @access  Private (Member for own loan, Librarian & Admin)
 */
const renewBook = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('book')
      .populate('member', 'name email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction record not found.',
      });
    }

    // If requested by a member, verify ownership
    if (
      req.user.role === 'member' &&
      transaction.member._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only renew books borrowed under your own account.',
      });
    }

    if (transaction.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot renew a book that has already been returned.',
      });
    }

    // Renewal Guard 1: Allow renewal only once
    if (transaction.renewCount >= 1) {
      return res.status(400).json({
        success: false,
        message: 'Renewal limit reached. This book loan has already been renewed once.',
      });
    }

    // Renewal Guard 2: Prevent renewal if another member has reserved the book
    const existingReservation = await Reservation.findOne({
      book: transaction.book._id,
      status: { $in: ['pending', 'available'] },
    });

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message: 'Cannot renew: Another member has already reserved this title. Please return it on time.',
      });
    }

    // Renewal Guard 3: If already past due, cannot renew until overdue fine is handled
    const now = new Date();
    if (now > new Date(transaction.dueDate)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot renew an overdue book. Please visit the library desk to clear dues and return the book.',
      });
    }

    const settings = await Settings.getSettings();

    // Extend Due Date from current due date
    const currentDue = new Date(transaction.dueDate);
    currentDue.setDate(currentDue.getDate() + settings.loanPeriodDays);

    transaction.dueDate = currentDue;
    transaction.renewCount = (transaction.renewCount || 0) + 1;
    await transaction.save();

    // Notify member
    await Notification.create({
      recipient: transaction.member._id,
      title: 'Loan Renewed',
      message: `Your loan for '${transaction.book.title}' has been extended to ${currentDue.toLocaleDateString()}.`,
      type: 'general',
      link: '/member/borrowed',
    });

    const populatedTx = await Transaction.findById(transaction._id)
      .populate('book', 'title author isbn coverImage shelfLocation')
      .populate('member', 'name email memberId phone')
      .populate('issuedBy', 'name email');

    res.json({
      success: true,
      message: `Loan for '${transaction.book.title}' renewed successfully! New due date: ${currentDue.toLocaleDateString()}.`,
      transaction: populatedTx,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in member's borrowing records
 * @route   GET /api/transactions/my
 * @access  Private (Member)
 */
const getMyTransactions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { member: req.user._id };
    if (status) {
      if (status === 'active') {
        query.status = { $in: ['issued', 'overdue'] };
      } else {
        query.status = status;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('book', 'title author isbn coverImage shelfLocation')
      .populate('issuedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Compute live overdue status for active loans
    const now = new Date();
    const settings = await Settings.getSettings();

    const enhancedTransactions = transactions.map((t) => {
      const obj = t.toObject();
      if (obj.status === 'issued' && now > new Date(obj.dueDate)) {
        const diffDays = Math.ceil((now.getTime() - new Date(obj.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        obj.isOverdue = true;
        obj.currentOverdueDays = diffDays;
        obj.currentAccruedFine = diffDays * settings.finePerDay;
      } else {
        obj.isOverdue = false;
        obj.currentOverdueDays = 0;
        obj.currentAccruedFine = 0;
      }
      return obj;
    });

    res.json({
      success: true,
      count: enhancedTransactions.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      transactions: enhancedTransactions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all transactions with filtering and pagination
 * @route   GET /api/transactions
 * @access  Private (Admin & Librarian)
 */
const getAllTransactions = async (req, res, next) => {
  try {
    const { status, memberId, bookId, search, page = 1, limit = 15 } = req.query;

    const query = {};

    if (status) {
      if (status === 'active') {
        query.status = { $in: ['issued', 'overdue'] };
      } else {
        query.status = status;
      }
    }

    if (bookId) {
      query.book = bookId;
    }

    if (memberId) {
      query.member = memberId;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('book', 'title author isbn coverImage shelfLocation')
      .populate('member', 'name email memberId phone')
      .populate('issuedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Compute live overdue and accrued fine details
    const now = new Date();
    const settings = await Settings.getSettings();

    const enriched = transactions.map((t) => {
      const obj = t.toObject();
      if (obj.status === 'issued' && now > new Date(obj.dueDate)) {
        const diffDays = Math.ceil((now.getTime() - new Date(obj.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        obj.isOverdue = true;
        obj.currentOverdueDays = diffDays;
        obj.currentAccruedFine = diffDays * settings.finePerDay;
      } else {
        obj.isOverdue = false;
        obj.currentOverdueDays = 0;
        obj.currentAccruedFine = 0;
      }
      return obj;
    });

    res.json({
      success: true,
      count: enriched.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      transactions: enriched,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get transaction details by ID
 * @route   GET /api/transactions/:id
 * @access  Private (Admin, Librarian, or Member who owns the loan)
 */
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('book')
      .populate('member', 'name email memberId phone')
      .populate('issuedBy', 'name email role');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    // Member access guard
    if (
      req.user.role === 'member' &&
      transaction.member._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You cannot view loans belonging to other members.',
      });
    }

    res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a fine as paid
 * @route   PUT /api/transactions/:id/pay-fine
 * @access  Private (Admin & Librarian)
 */
const payFine = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('book', 'title author')
      .populate('member', 'name email memberId');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction record not found.',
      });
    }

    if (transaction.fineAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This transaction has no fine assessed.',
      });
    }

    if (transaction.finePaid) {
      return res.status(400).json({
        success: false,
        message: 'This fine has already been marked as paid.',
      });
    }

    transaction.finePaid = true;
    await transaction.save();

    // Create Notification for the member
    await Notification.create({
      recipient: transaction.member._id,
      title: 'Fine Payment Received',
      message: `Your fine payment of ₹${transaction.fineAmount} for '${transaction.book.title}' has been successfully recorded.`,
      type: 'fine_paid',
      link: '/member/fines',
    });

    res.json({
      success: true,
      message: `Fine of ₹${transaction.fineAmount} marked as paid for ${transaction.member.name}.`,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get fine summary and history for logged in member
 * @route   GET /api/transactions/fines/my
 * @access  Private (Member)
 */
const getMyFines = async (req, res, next) => {
  try {
    const transactionsWithFines = await Transaction.find({
      member: req.user._id,
      fineAmount: { $gt: 0 },
    })
      .populate('book', 'title author isbn coverImage')
      .sort({ createdAt: -1 });

    const totalPaid = transactionsWithFines
      .filter((t) => t.finePaid)
      .reduce((acc, t) => acc + t.fineAmount, 0);

    const totalPending = transactionsWithFines
      .filter((t) => !t.finePaid)
      .reduce((acc, t) => acc + t.fineAmount, 0);

    res.json({
      success: true,
      totalPaid,
      totalPending,
      finesCount: transactionsWithFines.length,
      fines: transactionsWithFines,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all unpaid fines across members
 * @route   GET /api/transactions/fines/pending
 * @access  Private (Admin & Librarian)
 */
const getPendingFines = async (req, res, next) => {
  try {
    const pendingTransactions = await Transaction.find({
      fineAmount: { $gt: 0 },
      finePaid: false,
    })
      .populate('book', 'title author isbn')
      .populate('member', 'name email memberId phone')
      .sort({ returnDate: -1, dueDate: -1 });

    const totalOutstanding = pendingTransactions.reduce((acc, t) => acc + t.fineAmount, 0);

    res.json({
      success: true,
      count: pendingTransactions.length,
      totalOutstanding,
      fines: pendingTransactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  issueBook,
  returnBook,
  renewBook,
  getMyTransactions,
  getAllTransactions,
  getTransactionById,
  payFine,
  getMyFines,
  getPendingFines,
};
