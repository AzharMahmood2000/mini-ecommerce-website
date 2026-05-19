const requireAdmin = (req, res, next) => {
  const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again later';
  try {
    if (!req.user) {
      console.warn('[ADMIN AUTH] Missing req.user. protect() must run first.');

      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Please login again.',
      });
    }

    if (String(req.user.role || '').toLowerCase() !== 'admin') {
      console.warn('[ADMIN AUTH] Forbidden access attempt by non-admin user:', {
        userId: req.user._id || req.user.id,
        email: req.user.email,
        role: req.user.role,
      });

      return res.status(403).json({
        success: false,
        message: 'Access Denied',
      });
    }

    console.log('[ADMIN AUTH] Admin access granted for:', {
      userId: req.user._id || req.user.id,
      email: req.user.email,
    });

    return next();
  } catch (error) {
    console.error('[ADMIN AUTH] Error:', error.message);

    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

const verifyAdmin = requireAdmin;

module.exports = {
  requireAdmin,
  verifyAdmin,
};