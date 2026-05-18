const express = require('express');
const { getAdminProducts } = require('../controllers/productController');
const { getAdminOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { verifyAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// GET /api/admin/products?page=1&limit=5
router.get('/products', protect, verifyAdmin, getAdminProducts);
router.get('/orders', protect, verifyAdmin, getAdminOrders);
router.patch('/orders/:id/status', protect, verifyAdmin, updateOrderStatus);

module.exports = router;
