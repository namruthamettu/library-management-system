const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

/**
 * @desc    Reserve an unavailable book (FIFO Queue)
 * @route   POST /api/reservations
 * @access  Private (Member)
 */
const createReservation = async (req, res, next) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'bookId is required to reserve a book.',
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found in library catalog.',
      });
    }

    // Reservation Rule 1: Books can only be reserved when available copies are zero
    if (book.availableCopies > 0) {
      return res.status(400).json({
        success: false,
        message: `This book currently has ${book.availableCopies} available copy/copies on shelf at location: '${book.shelfLocation}'. You can visit the library to borrow it directly rather than reserving.`,
      });
    }

    // Reservation Rule 2: Prevent reserving if member currently holds an active loan of this book
    const activeLoan = await Transaction.findOne({
      book: book._id,
      member: req.user._id,
      status: { $in: ['issued', 'overdue'] },
    });

    if (activeLoan) {
      return res.status(400).json({
        success: false,
        message: 'You currently have an active borrowed copy of this book. You cannot place a reservation.',
      });
    }

    // Reservation Rule 3: Prevent duplicate active reservation by same member for same book
    const existingReservation = await Reservation.findOne({
      book: book._id,
      member: req.user._id,
      status: { $in: ['pending', 'available'] },
    });

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active reservation for this book.',
      });
    }

    // Calculate position in queue
    const queuePosition = await Reservation.countDocuments({
      book: book._id,
      status: 'pending',
    }) + 1;

    // Create reservation
    const reservation = await Reservation.create({
      book: book._id,
      member: req.user._id,
      reservedAt: new Date(),
      status: 'pending',
    });

    // Create In-App Notification
    await Notification.create({
      recipient: req.user._id,
      title: 'Book Reserved',
      message: `You reserved '${book.title}'. Your position in the reservation queue is #${queuePosition}. We will notify you when a copy is returned.`,
      type: 'general',
      link: '/member/reservations',
    });

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('book', 'title author isbn coverImage shelfLocation')
      .populate('member', 'name email memberId');

    res.status(201).json({
      success: true,
      message: `Reservation confirmed for '${book.title}'. Your queue position is #${queuePosition}.`,
      queuePosition,
      reservation: populatedReservation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in member's reservations
 * @route   GET /api/reservations/my
 * @access  Private (Member)
 */
const getMyReservations = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { member: req.user._id };
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Reservation.countDocuments(query);
    const reservations = await Reservation.find(query)
      .populate('book', 'title author isbn coverImage shelfLocation totalCopies availableCopies')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Compute live queue position for pending reservations
    const enriched = await Promise.all(
      reservations.map(async (resItem) => {
        const obj = resItem.toObject();
        if (obj.status === 'pending') {
          const aheadCount = await Reservation.countDocuments({
            book: obj.book._id,
            status: 'pending',
            reservedAt: { $lt: obj.reservedAt },
          });
          obj.queuePosition = aheadCount + 1;
        }
        return obj;
      })
    );

    res.json({
      success: true,
      count: enriched.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      reservations: enriched,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reservations across library
 * @route   GET /api/reservations
 * @access  Private (Admin & Librarian)
 */
const getAllReservations = async (req, res, next) => {
  try {
    const { status, bookId, memberId, page = 1, limit = 15 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (bookId) query.book = bookId;
    if (memberId) query.member = memberId;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const total = await Reservation.countDocuments(query);
    const reservations = await Reservation.find(query)
      .populate('book', 'title author isbn coverImage shelfLocation')
      .populate('member', 'name email memberId phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: reservations.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      reservations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a reservation
 * @route   DELETE /api/reservations/:id
 * @access  Private (Member for own reservation, Admin & Librarian)
 */
const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('book');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation record not found.',
      });
    }

    // Role check: members can only cancel their own reservations
    if (
      req.user.role === 'member' &&
      reservation.member.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own reservations.',
      });
    }

    if (['fulfilled', 'cancelled', 'expired'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: `Reservation is already ${reservation.status}. Cannot cancel.`,
      });
    }

    const wasAvailable = reservation.status === 'available';
    reservation.status = 'cancelled';
    await reservation.save();

    // If this reservation held an 'available' book copy, pass it to the next reservation or restore stock
    if (wasAvailable && reservation.book) {
      const nextInQueue = await Reservation.findOne({
        book: reservation.book._id,
        status: 'pending',
      }).sort({ reservedAt: 1 });

      if (nextInQueue) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 48);
        nextInQueue.status = 'available';
        nextInQueue.expiresAt = expiryDate;
        await nextInQueue.save();

        await Notification.create({
          recipient: nextInQueue.member,
          title: 'Reserved Book Ready for Collection',
          message: `Your reserved book '${reservation.book.title}' is now ready for collection! Please collect within 48 hours (before ${expiryDate.toLocaleDateString()}).`,
          type: 'reservation_available',
          link: '/member/reservations',
        });
      } else {
        // Return copy to available stock
        const book = await Book.findById(reservation.book._id);
        if (book) {
          book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
          await book.save();
        }
      }
    }

    res.json({
      success: true,
      message: 'Reservation cancelled successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getAllReservations,
  cancelReservation,
};
