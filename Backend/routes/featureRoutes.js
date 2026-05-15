const express = require('express');
const {
  getAllFeatures,
  getFeatureByKey,
  updateFeature,
} = require('../controllers/featureController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// GET /api/features - public
router.get('/', getAllFeatures);

// GET /api/features/:key - public
router.get('/:key', getFeatureByKey);

// PUT /api/features/:key - admin only
router.put('/:key', protect, requireAdmin, updateFeature);

module.exports = router;
