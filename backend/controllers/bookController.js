const fs = require('fs');
const path = require('path');
const Book = require('../models/Book');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Reservation = require('../models/Reservation');

/**
 * @desc    Get all books with advanced search, filter, sort, and pagination
 * @route   GET /api/books
 * @access  Public
 */
const getBooks = async (req, res, next) => {
  try {
    const {
      search,
      title,
      author,
      isbn,
      category,
      availableOnly,
      sortBy = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Specific field filters
    if (title) {
      query.title = new RegExp(title.trim(), 'i');
    }
    if (author) {
      query.author = new RegExp(author.trim(), 'i');
    }
    if (isbn) {
      query.isbn = new RegExp(isbn.trim().toUpperCase(), 'i');
    }

    // General search across title, author, isbn, and publisher
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { isbn: searchRegex },
        { publisher: searchRegex },
      ];
    }

    // Filter by Category ObjectId
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by availability
    if (availableOnly === 'true' || availableOnly === true) {
      query.availableCopies = { $gt: 0 };
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // default: newest
    if (sortBy === 'title_asc') sortOptions = { title: 1 };
    if (sortBy === 'title_desc') sortOptions = { title: -1 };
    if (sortBy === 'year_desc') sortOptions = { publishedYear: -1 };
    if (sortBy === 'year_asc') sortOptions = { publishedYear: 1 };
    if (sortBy === 'availability') sortOptions = { availableCopies: -1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const totalBooks = await Book.countDocuments(query);
    const books = await Book.find(query)
      .populate('category', 'name description')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: books.length,
      total: totalBooks,
      pages: Math.ceil(totalBooks / limitNum) || 1,
      currentPage: pageNum,
      books,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single book details by ID
 * @route   GET /api/books/:id
 * @access  Public
 */
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate('category', 'name description');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found in library catalog.',
      });
    }

    // Check how many active reservations exist for this book
    const activeReservationsCount = await Reservation.countDocuments({
      book: book._id,
      status: { $in: ['pending', 'available'] },
    });

    res.json({
      success: true,
      book: {
        ...book.toObject(),
        activeReservationsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new book
 * @route   POST /api/books
 * @access  Private (Admin & Librarian)
 */
const createBook = async (req, res, next) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      publisher,
      publishedYear,
      totalCopies,
      availableCopies,
      shelfLocation,
    } = req.body;

    // Validate required fields
    if (!title || !author || !isbn || !category || !publisher || !publishedYear || !totalCopies || !shelfLocation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, author, isbn, category, publisher, publishedYear, totalCopies, and shelfLocation.',
      });
    }

    // Check duplicate ISBN
    const normalizedISBN = isbn.trim().toUpperCase();
    const existingBook = await Book.findOne({ isbn: normalizedISBN });
    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: `A book with ISBN '${normalizedISBN}' already exists in the catalog (${existingBook.title}).`,
      });
    }

    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'The selected category does not exist.',
      });
    }

    const total = parseInt(totalCopies, 10);
    const available = availableCopies !== undefined ? parseInt(availableCopies, 10) : total;

    if (available > total) {
      return res.status(400).json({
        success: false,
        message: 'Available copies cannot exceed total copies.',
      });
    }

    // Determine cover image URL
    let coverImage = req.body.coverImage || '';
    if (req.file) {
      coverImage = `/uploads/${req.file.filename}`;
    }

    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      isbn: normalizedISBN,
      category,
      publisher: publisher.trim(),
      publishedYear: parseInt(publishedYear, 10),
      totalCopies: total,
      availableCopies: available,
      coverImage,
      shelfLocation: shelfLocation.trim(),
    });

    const populatedBook = await Book.findById(book._id).populate('category', 'name description');

    res.status(201).json({
      success: true,
      message: `Book '${book.title}' added to catalog successfully.`,
      book: populatedBook,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update book details
 * @route   PUT /api/books/:id
 * @access  Private (Admin & Librarian)
 */
const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.',
      });
    }

    const {
      title,
      author,
      isbn,
      category,
      publisher,
      publishedYear,
      totalCopies,
      availableCopies,
      shelfLocation,
    } = req.body;

    // Check ISBN uniqueness if changed
    if (isbn && isbn.trim().toUpperCase() !== book.isbn) {
      const normalizedISBN = isbn.trim().toUpperCase();
      const existing = await Book.findOne({ isbn: normalizedISBN });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `ISBN '${normalizedISBN}' is already assigned to '${existing.title}'.`,
        });
      }
      book.isbn = normalizedISBN;
    }

    if (category) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'The selected category does not exist.',
        });
      }
      book.category = category;
    }

    if (title) book.title = title.trim();
    if (author) book.author = author.trim();
    if (publisher) book.publisher = publisher.trim();
    if (publishedYear) book.publishedYear = parseInt(publishedYear, 10);
    if (shelfLocation) book.shelfLocation = shelfLocation.trim();

    // Check copies adjustments
    if (totalCopies !== undefined) {
      const newTotal = parseInt(totalCopies, 10);
      const currentlyIssued = book.totalCopies - book.availableCopies;

      if (newTotal < currentlyIssued) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce total copies to ${newTotal}. There are currently ${currentlyIssued} copies on active loan.`,
        });
      }

      // Adjust available copies based on new total
      book.availableCopies = newTotal - currentlyIssued;
      book.totalCopies = newTotal;
    }

    if (availableCopies !== undefined) {
      const newAvailable = parseInt(availableCopies, 10);
      if (newAvailable > book.totalCopies) {
        return res.status(400).json({
          success: false,
          message: 'Available copies cannot exceed total copies.',
        });
      }
      book.availableCopies = newAvailable;
    }

    // Handle new uploaded cover
    if (req.file) {
      // Delete old local file if present
      if (book.coverImage && book.coverImage.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', book.coverImage);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      book.coverImage = `/uploads/${req.file.filename}`;
    } else if (req.body.coverImage) {
      book.coverImage = req.body.coverImage;
    }

    await book.save();
    const updatedBook = await Book.findById(book._id).populate('category', 'name description');

    res.json({
      success: true,
      message: 'Book updated successfully.',
      book: updatedBook,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a book (prevented if copies are currently issued)
 * @route   DELETE /api/books/:id
 * @access  Private (Admin & Librarian)
 */
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.',
      });
    }

    // Check if any copies are currently issued or overdue
    const activeLoans = await Transaction.countDocuments({
      book: book._id,
      status: { $in: ['issued', 'overdue'] },
    });

    if (activeLoans > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete '${book.title}'. There are currently ${activeLoans} copy/copies issued to members. Accept their return first.`,
      });
    }

    // Remove cover image file if local
    if (book.coverImage && book.coverImage.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', book.coverImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Book.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Book '${book.title}' deleted from library catalog.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
