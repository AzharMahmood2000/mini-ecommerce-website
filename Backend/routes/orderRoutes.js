const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.get('/', protect, getUserOrders);
router.get('/:id', protect, getOrderById);
router.post('/', protect, createOrder);

// Admin route to update order status
router.patch('/:id/status', protect, requireAdmin, updateOrderStatus);

module.exports = router;
