const express = require('express');
const { getHomeProducts } = require('../controllers/productController');

const router = express.Router();

// GET /api/home-products - Get products flagged for home page (max 8)
router.get('/', getHomeProducts);

module.exports = router;
