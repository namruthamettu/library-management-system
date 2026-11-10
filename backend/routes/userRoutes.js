const express = require('express');
const {
  updateProfile,
  getUsers,
  getUserById,
  toggleUserStatus,
  createLibrarian,
  updateLibrarian,
  deleteLibrarian,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Profile update for any logged in user
router.put('/profile', protect, updateProfile);

// User lists and single user lookups (Admin & Librarian)
router.get('/', protect, authorize('admin', 'librarian'), getUsers);
router.get('/:id', protect, authorize('admin', 'librarian'), getUserById);

// Activate / Deactivate user status
router.put('/:id/status', protect, authorize('admin', 'librarian'), toggleUserStatus);

// Librarian management (Admin only)
router.post('/librarian', protect, authorize('admin'), createLibrarian);
router.put('/librarian/:id', protect, authorize('admin'), updateLibrarian);
router.delete('/librarian/:id', protect, authorize('admin'), deleteLibrarian);

module.exports = router;
