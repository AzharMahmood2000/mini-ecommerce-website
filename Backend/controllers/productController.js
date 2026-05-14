const Product = require('../models/Product');
const mongoose = require('mongoose');

// Create a new product (admin only)
const createProduct = async (req, res) => {
  try {
    console.log('[CREATE PRODUCT] Incoming request', {
      hasBody: !!req.body,
      hasFile: !!req.file,
      contentType: req.headers?.['content-type'],
      fileName: req.file?.filename || null,
    });

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { name, price, discountPrice, category, stock, description, imageUrl, brand } = body;
    const uploadedImageUrl = req.file && req.file.filename ? `/uploads/products/${req.file.filename}` : '';
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedDiscountPrice = discountPrice === undefined || discountPrice === '' ? null : Number(discountPrice);

    // Validate required fields
    if (!name || !price || !category || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, price, category, stock',
      });
    }

    // Validate numeric fields
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number',
      });
    }

    if (Number.isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a positive integer',
      });
    }

    if (parsedDiscountPrice !== null && (Number.isNaN(parsedDiscountPrice) || parsedDiscountPrice > parsedPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Discount price must be less than price',
      });
    }

    const newProduct = new Product({
      name,
      price: parsedPrice,
      discountPrice: parsedDiscountPrice,
      category,
      stock: parsedStock,
      description: description || '',
      // Prefer uploaded file path; fallback to provided imageUrl (which may be absolute or relative)
      imageUrl: uploadedImageUrl || imageUrl || '',
      brand: brand || '',
    });
    // Save with validation; return validation errors as 400
    try {
      const saved = await newProduct.save();
      console.log('[CREATE PRODUCT] Product saved', {
        productId: saved._id,
        imageUrl: saved.imageUrl,
      });
      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product: saved,
      });
    } catch (saveErr) {
      // If validation error from Mongoose, return 400 with details
      if (saveErr.name === 'ValidationError') {
        const errors = Object.keys(saveErr.errors).reduce((acc, key) => {
          acc[key] = saveErr.errors[key].message;
          return acc;
        }, {});
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
      }
      throw saveErr;
    }
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

    // pagination is requested
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
    console.log('[UPDATE PRODUCT] Incoming request', {
      hasBody: !!req.body,
      hasFile: !!req.file,
      contentType: req.headers?.['content-type'],
      fileName: req.file?.filename || null,
      productId: req.params?.id || null,
    });

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const allowedFields = ['name', 'price', 'discountPrice', 'description', 'category', 'stock', 'imageUrl', 'brand'];
    const updates = {};

    if (req.file) {
      updates.imageUrl = `/uploads/products/${req.file.filename}`;
    }

    if (body && typeof body === 'object') {
      allowedFields.forEach((field) => {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      });
    }

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }

    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock);
    }

    if (updates.discountPrice !== undefined) {
      updates.discountPrice = updates.discountPrice === '' ? null : Number(updates.discountPrice);
    }

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
