const express = require('express');
const {
  issueBook,
  returnBook,
  renewBook,
  getMyTransactions,
  getAllTransactions,
  getTransactionById,
  payFine,
  getMyFines,
  getPendingFines,
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Member self-service endpoints
router.get('/my', protect, getMyTransactions);
router.get('/fines/my', protect, getMyFines);

// Staff pending fines dashboard
router.get('/fines/pending', protect, authorize('admin', 'librarian'), getPendingFines);

// Circulation management endpoints (Librarian & Admin)
router.post('/issue', protect, authorize('admin', 'librarian'), issueBook);
router.put('/:id/return', protect, authorize('admin', 'librarian'), returnBook);
router.put('/:id/pay-fine', protect, authorize('admin', 'librarian'), payFine);
router.get('/', protect, authorize('admin', 'librarian'), getAllTransactions);

// Renewal endpoint (Member for own loans, Librarian & Admin for desk renewals)
router.put('/:id/renew', protect, renewBook);

// Single transaction details
router.get('/:id', protect, getTransactionById);

module.exports = router;
