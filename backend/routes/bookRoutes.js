const express = require('express');
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/authMiddleware');
const uploadCover = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/')
  .get(getBooks)
  .post(protect, authorize('admin', 'librarian'), uploadCover.single('coverImage'), createBook);

router.route('/:id')
  .get(getBookById)
  .put(protect, authorize('admin', 'librarian'), uploadCover.single('coverImage'), updateBook)
  .delete(protect, authorize('admin', 'librarian'), deleteBook);

module.exports = router;
