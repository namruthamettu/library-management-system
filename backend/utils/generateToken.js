
const jwt = require('jsonwebtoken');

/**
 * Generates a signed JSON Web Token.
 * @param {string} id - MongoDB User ObjectId
 * @param {string} role - User role
 * @returns {string} Signed JWT token
 */
const generateToken = (id, role) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is missing from environment variables');
    }

    return jwt.sign(
        {
            id: id.toString(),
            role: role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
    );
};

module.exports = generateToken;