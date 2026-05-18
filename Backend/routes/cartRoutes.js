const express = require('express');
const { getCart, upsertCart } = require('../controllers/cartController');

const router = express.Router();

// GET /api/cart?cartId=...
router.get('/', getCart);

// POST /api/cart - add/update item
router.post('/', upsertCart);

module.exports = router;
