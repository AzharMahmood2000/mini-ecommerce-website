const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing. Use Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token not found in Authorization header.',
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret is not configured on the server.',
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select('username email role isActive name mobile location avatarUrl lastLoginAt');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with this token was not found.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account is inactive.',
      });
    }

    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      name: user.name,
      mobile: user.mobile,
      location: user.location,
      avatarUrl: user.avatarUrl,
      lastLoginAt: user.lastLoginAt,
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please provide a valid token.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error while verifying token.',
    });
  }
};

module.exports = {
  protect,
};