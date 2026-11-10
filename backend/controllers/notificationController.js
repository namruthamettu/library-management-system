const Notification = require('../models/Notification');
const {
  checkDueDateReminders,
  checkOverdueAndFines,
  checkReservationExpirations,
} = require('../jobs/cronJobs');

/**
 * @desc    Get currently logged-in user's notifications
 * @route   GET /api/notifications
 * @access  Private (All authenticated roles)
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      unreadCount,
      total,
      count: notifications.length,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (All authenticated roles)
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read.',
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all user notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private (All authenticated roles)
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manually trigger scheduled background tasks on-demand
 * @route   POST /api/notifications/trigger-jobs
 * @access  Private (Admin only)
 */
const triggerCronNow = async (req, res, next) => {
  try {
    console.log('[Admin Action] Manually triggering all background scan jobs...');

    const dueResult = await checkDueDateReminders();
    const overdueResult = await checkOverdueAndFines();
    const expiryResult = await checkReservationExpirations();

    res.json({
      success: true,
      message: 'Scheduled reminder and maintenance jobs executed successfully.',
      results: {
        dueDateReminders: dueResult,
        overdueAndFines: overdueResult,
        reservationExpiry: expiryResult,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  triggerCronNow,
};
