const express = require('express');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(protect, authorize('admin', 'librarian'), createCategory);

router.route('/:id')
  .get(getCategoryById)
  .put(protect, authorize('admin', 'librarian'), updateCategory)
  .delete(protect, authorize('admin', 'librarian'), deleteCategory);

module.exports = router;
