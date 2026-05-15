const express = require('express');
const { getCategories } = require('../controllers/productController');

const router = express.Router();

// GET /api/categories - unique categories from products
router.get('/', getCategories);

module.exports = router;
