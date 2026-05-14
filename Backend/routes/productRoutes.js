const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();


// POST /api/products - Create a new product (admin only)
router.post('/', protect, requireAdmin, createProduct);

// PUT /api/products/:id - Update a product (admin only)
router.put('/:id', protect, requireAdmin, updateProduct);

// DELETE /api/products/:id - Delete a product (admin only)
router.delete('/:id', protect, requireAdmin, deleteProduct);


// GET /api/products - Get all products (optional: filter by category, sort, pagination)
router.get('/', getAllProducts);

// GET /api/products/:id - Get a single product by ID
router.get('/:id', getProductById);



module.exports = router;
