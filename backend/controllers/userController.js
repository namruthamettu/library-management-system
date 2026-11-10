const User = require('../models/User');

/**
 * @desc    Update current user profile (name, phone, change password)
 * @route   PUT /api/users/profile
 * @access  Private (All authenticated users)
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const { name, phone, oldPassword, newPassword } = req.body;

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();

    // If changing password, verify old password first
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        });
      }

      const isMatch = await user.matchPassword(oldPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.',
        });
      }

      user.password = newPassword; // Will be hashed by pre('save')
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        memberId: user.memberId,
        phone: user.phone,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with search, role filtering, pagination
 * @route   GET /api/users
 * @access  Private (Admin & Librarian)
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 10, isActive } = req.query;

    const query = {};

    // Filter by role if specified
    if (role) {
      query.role = role;
    }

    // Filter by active status if specified
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search by name, email, or memberId
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { memberId: searchRegex },
        { phone: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: users.length,
      total: totalUsers,
      pages: Math.ceil(totalUsers / limitNum) || 1,
      currentPage: pageNum,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin & Librarian)
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Activate or deactivate user account
 * @route   PUT /api/users/:id/status
 * @access  Private (Admin for all, Librarian for members)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Protection: Librarians can only toggle member statuses
    if (req.user.role === 'librarian' && targetUser.role !== 'member') {
      return res.status(403).json({
        success: false,
        message: 'Librarians can only modify member account status.',
      });
    }

    // Cannot deactivate oneself
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    // Toggle or set isActive
    const { isActive } = req.body;
    targetUser.isActive = isActive !== undefined ? isActive : !targetUser.isActive;
    await targetUser.save();

    res.json({
      success: true,
      message: `User account has been ${targetUser.isActive ? 'activated' : 'deactivated'} successfully.`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin creates a Librarian account
 * @route   POST /api/users/librarian
 * @access  Private (Admin only)
 */
const createLibrarian = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required to create a librarian account.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const librarian = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'librarian',
      phone: phone || '',
      memberId: `LIB-${Math.floor(1000 + Math.random() * 9000)}`,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `Librarian account created for ${librarian.name}`,
      librarian: {
        _id: librarian._id,
        name: librarian.name,
        email: librarian.email,
        role: librarian.role,
        memberId: librarian.memberId,
        phone: librarian.phone,
        isActive: librarian.isActive,
        createdAt: librarian.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin updates a Librarian account
 * @route   PUT /api/users/librarian/:id
 * @access  Private (Admin only)
 */
const updateLibrarian = async (req, res, next) => {
  try {
    const librarian = await User.findById(req.params.id);

    if (!librarian || librarian.role !== 'librarian') {
      return res.status(404).json({
        success: false,
        message: 'Librarian account not found.',
      });
    }

    const { name, phone, password, isActive } = req.body;

    if (name) librarian.name = name.trim();
    if (phone !== undefined) librarian.phone = phone.trim();
    if (isActive !== undefined) librarian.isActive = isActive;
    if (password && password.length >= 6) {
      librarian.password = password; // Will be hashed by pre('save')
    }

    await librarian.save();

    res.json({
      success: true,
      message: 'Librarian account updated successfully.',
      librarian: {
        _id: librarian._id,
        name: librarian.name,
        email: librarian.email,
        role: librarian.role,
        phone: librarian.phone,
        isActive: librarian.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin deletes a Librarian account
 * @route   DELETE /api/users/librarian/:id
 * @access  Private (Admin only)
 */
const deleteLibrarian = async (req, res, next) => {
  try {
    const librarian = await User.findById(req.params.id);

    if (!librarian || librarian.role !== 'librarian') {
      return res.status(404).json({
        success: false,
        message: 'Librarian account not found.',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Librarian account '${librarian.name}' removed successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  getUsers,
  getUserById,
  toggleUserStatus,
  createLibrarian,
  updateLibrarian,
  deleteLibrarian,
};
