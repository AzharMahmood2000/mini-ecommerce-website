const Order = require('../models/Order');
const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again later';

const buildCustomerAddress = (shippingAddress = {}) => {
  if (typeof shippingAddress === 'string') {
    return shippingAddress;
  }

  return shippingAddress.address || '';
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      products,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      deliveryStatus,
      customerName,
      email,
      phone,
      address,
    } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    const resolvedCustomerName = customerName || shippingAddress?.fullName || req.user?.username || 'Customer';
    const resolvedEmail = email || shippingAddress?.email || req.user?.email || '';
    const resolvedPhone = phone || shippingAddress?.phone || shippingAddress?.mobileNumber || '';
    const resolvedAddress = address || buildCustomerAddress(shippingAddress) || '';

    if (!resolvedCustomerName || !resolvedEmail || !resolvedPhone || !resolvedAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required customer details for order.',
      });
    }

    const order = new Order({
      userId: req.user._id,
      customerName: resolvedCustomerName,
      email: resolvedEmail,
      phone: resolvedPhone,
      address: resolvedAddress,
      products,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentStatus || 'pending',
      deliveryStatus: deliveryStatus || 'processing',
      orderStatus: deliveryStatus || 'processing',
    });

    console.log('[ORDER CREATE] Saving order:', {
      userId: req.user._id,
      customerName: resolvedCustomerName,
      totalAmount,
      items: products.length,
    });

    const createdOrder = await order.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: createdOrder,
    });
  } catch (error) {
    console.error('[ORDER CREATE] Error creating order:', error);
    res.status(500).json({ success: false, message: GENERIC_SERVER_MESSAGE });
  }
};

// @desc    Get orders for logged-in user
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('[MY ORDERS] Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

// Backward-compatible user orders route
const getUserOrders = getMyOrders;

const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'username email role');

    console.log('[ADMIN ORDERS] Fetched orders:', orders.length);

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('[ADMIN ORDERS] Error fetching orders:', error);
    return res.status(500).json({ success: false, message: GENERIC_SERVER_MESSAGE });
  }
};

// @desc    Get order by id for the logged-in user
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'username email role');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user?.role !== 'admin' && String(order.userId?._id || order.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    console.log('[ORDER DETAILS] Loaded order:', {
      orderId: order._id,
      userId: req.user._id,
      totalAmount: order.totalAmount,
    });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('[ORDER DETAILS] Error:', error);
    return res.status(500).json({ success: false, message: GENERIC_SERVER_MESSAGE });
  }
};

// Admin: update order status
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.deliveryStatus = status || order.deliveryStatus;
    order.orderStatus = status || order.orderStatus;
    await order.save();

    return res.status(200).json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ success: false, message: GENERIC_SERVER_MESSAGE });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getUserOrders,
  getAdminOrders,
  getOrderById,
  updateOrderStatus,
};
