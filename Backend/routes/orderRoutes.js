const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getUserOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.get('/my', protect, getMyOrders);
router.get('/', protect, getUserOrders);
router.get('/:id', protect, getOrderById);
router.post('/', protect, createOrder);

// Admin route to update order status
router.patch('/:id/status', protect, requireAdmin, updateOrderStatus);

module.exports = router;
