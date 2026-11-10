const express = require('express');
const {
  getDashboardMetrics,
  getMemberDashboard,
  getReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', protect, authorize('admin', 'librarian'), getDashboardMetrics);
router.get('/member-dashboard', protect, authorize('member'), getMemberDashboard);
router.get('/:type', protect, authorize('admin', 'librarian'), getReport);

module.exports = router;
