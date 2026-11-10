
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes using JWT authentication
 * Authorization: Bearer <token>
 */
const protect = async (req, res, next) => {
    try {
        // Check Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please provide a valid Bearer token.'
            });
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is missing.'
            });
        }

        // Check JWT secret
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is missing from environment variables.');

            return res.status(500).json({
                success: false,
                message: 'Authentication service is not configured.'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user using token ID
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User associated with this token no longer exists.'
            });
        }

        // Check account status
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Contact the administrator.'
            });
        }

        // Attach authenticated user to request
        req.user = user;

        next();

    } catch (error) {

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Your authentication token has expired. Please log in again.'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token.'
            });
        }

        console.error('[Authentication Error]:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Authentication failed due to a server error.'
        });
    }
};

/**
 * Authorize specific user roles
 * Example: authorize('admin', 'librarian')
 */
const authorize = (...roles) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Please log in to access this resource.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource.'
            });
        }

        next();
    };
};

module.exports = {
    protect,
    authorize
};