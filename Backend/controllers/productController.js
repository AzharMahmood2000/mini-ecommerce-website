const Product = require('../models/Product');
const mongoose = require('mongoose');

// Create a new product (admin only)
const createProduct = async (req, res) => {
  try {
    const { name, price, discountPrice, category, stock, description, imageUrl, brand } = req.body;

    // Validate required fields
    if (!name || !price || !category || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, price, category, stock',
      });
    }

    // Validate numeric fields
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number',
      });
    }

    if (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock)) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a positive integer',
      });
    }

    if (discountPrice && (typeof discountPrice !== 'number' || discountPrice > price)) {
      return res.status(400).json({
        success: false,
        message: 'Discount price must be less than price',
      });
    }

    const newProduct = await Product.create({
      name,
      price,
      discountPrice: discountPrice || null,
      category,
      stock,
      description: description || '',
      imageUrl: imageUrl || '',
      brand: brand || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    console.error('Create product error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product',
    });
  }
};

// Get all products with optional filters, sorting, and pagination
const getAllProducts = async (req, res) => {
  try {
    const { category, sort, page, limit } = req.query;

    const filter = {};
    if (category) filter.category = category;

    // Determine sort order
    let sortObj = { createdAt: -1 }; // default: newest first
    if (sort) {
      switch (sort.toLowerCase()) {
        case 'price_asc':
          sortObj = { price: 1 };
          break;
        case 'price_desc':
          sortObj = { price: -1 };
          break;
        case 'newest':
          sortObj = { createdAt: -1 };
          break;
        case 'oldest':
          sortObj = { createdAt: 1 };
          break;
        default:
          sortObj = { createdAt: -1 };
      }
    }

    let products = [];
    let totalProducts = 0;
    let currentPage = 1;
    let totalPages = 1;

    // Check if pagination is requested
    if (page || limit) {
      currentPage = Math.max(parseInt(page) || 1, 1);
      const perPage = Math.max(parseInt(limit) || 6, 1);
      const skip = (currentPage - 1) * perPage;

      totalProducts = await Product.countDocuments(filter);
      totalPages = Math.ceil(totalProducts / perPage);

      products = await Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(perPage);
    } else {
      // Return all products without pagination
      products = await Product.find(filter).sort(sortObj);
      totalProducts = products.length;
    }

    return res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      currentPage: page ? currentPage : 1,
      totalPages: page ? totalPages : 1,
      products,
    });
  } catch (error) {
    console.error('Get all products error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch products',
    });
  }
};

// Get a single product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Get product error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch product',
    });
  }
};

// Update a product (admin only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const allowedFields = ['name', 'price', 'discountPrice', 'description', 'category', 'stock', 'imageUrl', 'brand'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body.hasOwnProperty(field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
      });
    }

    const product = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product',
    });
  }
};

// Delete a product (admin only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      product,
    });
  } catch (error) {
    console.error('Delete product error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete product',
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
