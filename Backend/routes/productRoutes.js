const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  toggleHomeProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { singleImageUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();



// POST /api/products/upload - Upload a product image (admin only)
router.post('/upload', protect, requireAdmin, singleImageUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    imageUrl: `/uploads/products/${req.file.filename}`,
    file: req.file,
  });
});

// POST /api/products - Create a product with optional image upload (admin only)
router.post('/', protect, requireAdmin, singleImageUpload, createProduct);

// PUT /api/products/:id - Update a product (admin only)
router.put('/:id', protect, requireAdmin, singleImageUpload, updateProduct);

// PATCH /api/products/:id/toggle-home - Toggle home page visibility (admin only)
router.patch('/:id/toggle-home', protect, requireAdmin, toggleHomeProduct);

// DELETE /api/products/:id - Delete a product (admin only)
router.delete('/:id', protect, requireAdmin, deleteProduct);


// GET /api/products - Get all products (optional: filter by category, sort, pagination)
router.get('/', getAllProducts);

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', getProductsByCategory);

// GET /api/products/:id - Get a single product by ID
router.get('/:id', getProductById);



module.exports = router;
