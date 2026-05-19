const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again later';

const protect = async (req, res, next) => {
  try {
    console.log('  [Protect] Checking authorization...');
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('  [Protect] No valid auth header');
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing. Use Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log('  [Protect] No token in auth header');
      return res.status(401).json({
        success: false,
        message: 'Token not found in Authorization header.',
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.log('  [Protect] No JWT secret configured');
      return res.status(500).json({
        success: false,
        message: GENERIC_SERVER_MESSAGE,
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select('username email role isActive name mobile location avatarUrl profileImage lastLoginAt');

    if (!user) {
      console.log('  [Protect] User not found for token');
      return res.status(401).json({
        success: false,
        message: 'User associated with this token was not found.',
      });
    }

    if (!user.isActive) {
      console.log('  [Protect] User is inactive');
      return res.status(403).json({
        success: false,
        message: 'This account is inactive.',
      });
    }

    console.log(`  [Protect] Auth successful for user: ${user.email}, calling next()`);
    req.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      name: user.name,
      mobile: user.mobile,
      location: user.location,
      avatarUrl: user.avatarUrl,
      profileImage: user.profileImage,
      lastLoginAt: user.lastLoginAt,
    };

    return next();
  } catch (error) {
    console.log(`  [Protect] Error: ${error.message}`);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Please login again.',
      });
    }

    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

module.exports = {
  protect,
};