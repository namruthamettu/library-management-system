
const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Remove password and other sensitive information from responses
const formatUserResponse = (user) => {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        memberId: user.memberId,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
};

// Generate a unique member ID
const generateMemberId = async () => {
    let memberId;
    let exists = true;

    while (exists) {
        memberId = `MEM-${Math.floor(100000 + Math.random() * 900000)}`;

        exists = await User.exists({ memberId });
    }

    return memberId;
};

/**
 * @desc    Register a new library member
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        // Validate request
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const { name, email, password, memberId, phone } = req.body;

        const normalizedEmail = email.trim().toLowerCase();

        // Check existing email
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        // Check provided member ID
        let finalMemberId;

        if (memberId && memberId.trim()) {
            finalMemberId = memberId.trim();

            const existingMember = await User.findOne({
                memberId: finalMemberId
            });

            if (existingMember) {
                return res.status(409).json({
                    success: false,
                    message: 'This member ID is already registered.'
                });
            }
        } else {
            finalMemberId = await generateMemberId();
        }

        // Create member
        // Public registration cannot assign admin or librarian roles
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            memberId: finalMemberId,
            phone: phone ? phone.trim() : '',
            role: 'member',
            isActive: true
        });

        // Generate JWT
        const token = generateToken(user._id, user.role);

        return res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user: formatUserResponse(user)
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        // Validate request
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        const normalizedEmail = email.trim().toLowerCase();

        // Find user and include password hash
        const user = await User.findOne({
            email: normalizedEmail
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Check account status
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account is deactivated. Contact the administrator.'
            });
        }

        // Compare password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Generate token
        const token = generateToken(user._id, user.role);

        return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            token,
            user: formatUserResponse(user)
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found.'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account is deactivated.'
            });
        }

        return res.status(200).json({
            success: true,
            user: formatUserResponse(user)
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe
};
