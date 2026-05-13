const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      console.warn('[ADMIN AUTH] Missing req.user. protect() must run first.');

      return res.status(500).json({
        success: false,
        message: 'Authentication middleware must run before admin authorization.',
      });
    }

    if (req.user.role !== 'admin') {
      console.warn('[ADMIN AUTH] Forbidden access attempt by non-admin user:', {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
      });

      return res.status(403).json({
        success: false,
        message: 'Forbidden. Admin access is required to create products.',
      });
    }

    console.log('[ADMIN AUTH] Admin access granted for:', {
      userId: req.user.id,
      email: req.user.email,
    });

    return next();
  } catch (error) {
    console.error('[ADMIN AUTH] Error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Error while checking admin permissions.',
    });
  }
};

module.exports = {
  requireAdmin,
};