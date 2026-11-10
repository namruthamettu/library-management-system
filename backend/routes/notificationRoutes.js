const express = require('express');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  triggerCronNow,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.post('/trigger-jobs', protect, authorize('admin'), triggerCronNow);

module.exports = router;
