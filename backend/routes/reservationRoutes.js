const express = require('express');
const {
  createReservation,
  getMyReservations,
  getAllReservations,
  cancelReservation,
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, authorize('member'), createReservation);
router.get('/my', protect, getMyReservations);
router.get('/', protect, authorize('admin', 'librarian'), getAllReservations);
router.delete('/:id', protect, cancelReservation);

module.exports = router;
