const express = require('express');
const { getAdminProducts } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// GET /api/admin/products?page=1&limit=5
router.get('/products', protect, requireAdmin, getAdminProducts);

module.exports = router;
