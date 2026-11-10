const Settings = require('../models/Settings');

/**
 * @desc    Get active library system settings
 * @route   GET /api/settings
 * @access  Public / Authenticated
 */
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update library system configuration
 * @route   PUT /api/settings
 * @access  Private (Admin only)
 */
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const { loanPeriodDays, finePerDay, maxBooksPerMember, maxUnpaidFine } = req.body;

    if (loanPeriodDays !== undefined) {
      const val = parseInt(loanPeriodDays, 10);
      if (val < 1 || val > 90) {
        return res.status(400).json({
          success: false,
          message: 'Loan period must be between 1 and 90 days.',
        });
      }
      settings.loanPeriodDays = val;
    }

    if (finePerDay !== undefined) {
      const val = parseFloat(finePerDay);
      if (val < 0) {
        return res.status(400).json({
          success: false,
          message: 'Fine per day cannot be negative.',
        });
      }
      settings.finePerDay = val;
    }

    if (maxBooksPerMember !== undefined) {
      const val = parseInt(maxBooksPerMember, 10);
      if (val < 1 || val > 20) {
        return res.status(400).json({
          success: false,
          message: 'Maximum books per member must be between 1 and 20.',
        });
      }
      settings.maxBooksPerMember = val;
    }

    if (maxUnpaidFine !== undefined) {
      const val = parseFloat(maxUnpaidFine);
      if (val < 0) {
        return res.status(400).json({
          success: false,
          message: 'Maximum unpaid fine threshold cannot be negative.',
        });
      }
      settings.maxUnpaidFine = val;
    }

    settings.updatedBy = req.user._id;
    await settings.save();

    res.json({
      success: true,
      message: 'Library system settings updated successfully.',
      settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
