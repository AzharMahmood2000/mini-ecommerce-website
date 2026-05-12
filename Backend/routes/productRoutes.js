const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

console.log('🔧 Setting up Product routes...');

// POST /api/products - Create a new product
router.post('/', createProduct);
console.log(' POST / route registered');

// GET /api/products - Get all products with optional filters
router.get('/', getAllProducts);
console.log(' GET / route registered');

// GET /api/products/:id - Get a specific product by ID
router.get('/:id', getProductById);
console.log(' GET /:id route registered');

// PUT /api/products/:id - Update a product
router.put('/:id', updateProduct);
console.log(' PUT /:id route registered');

// DELETE /api/products/:id - Delete a product
router.delete('/:id', deleteProduct);
console.log(' DELETE /:id route registered');

module.exports = router;
