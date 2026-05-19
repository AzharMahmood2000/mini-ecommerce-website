const Product = require('../models/Product');
const mongoose = require('mongoose');
const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again later';

const OFFICIAL_CATEGORIES = [
  'Electronics',
  'Mobile Devices',
  'Audio Systems',
  'Information Systems',
  'Gaming',
];

const CATEGORY_ALIASES = {
  'Mobile Phones': 'Mobile Devices',
};

const normalizeCategory = (category) => {
  if (category === undefined || category === null) return '';

  const trimmed = String(category).trim();
  return CATEGORY_ALIASES[trimmed] || trimmed;
};

const isOfficialCategory = (category) => OFFICIAL_CATEGORIES.includes(normalizeCategory(category));

const normalizeProduct = (product) => {
  if (!product) return product;

  const normalizedProduct = typeof product.toObject === 'function' ? product.toObject() : { ...product };
  normalizedProduct.category = normalizeCategory(normalizedProduct.category);

  return normalizedProduct;
};

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') return false;

  return defaultValue;
};

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
    const { name, price, discountPrice, category, stock, description, imageUrl, brand, sku, showOnHome } = body;
    const uploadedImageUrl = req.file && req.file.filename ? `/uploads/products/${req.file.filename}` : '';
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedDiscountPrice = discountPrice === undefined || discountPrice === '' ? null : Number(discountPrice);
    const parsedShowOnHome = parseBoolean(showOnHome, false);
    const normalizedCategory = normalizeCategory(category);

    // Validate required fields
    if (!name || price === undefined || price === '' || !category || stock === undefined || stock === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, price, category, stock',
      });
    }

    if (!isOfficialCategory(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed categories: ${OFFICIAL_CATEGORIES.join(', ')}`,
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
      category: normalizedCategory,
      stock: parsedStock,
      description: description || '',
      // Prefer uploaded file path; fallback to provided imageUrl (which may be absolute or relative)
      imageUrl: uploadedImageUrl || imageUrl || '',
      brand: brand || '',
      sku: sku || undefined,
      showOnHome: parsedShowOnHome,
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
        product: normalizeProduct(saved),
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
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

// Get all products with optional filters, sorting, and pagination
const getAllProducts = async (req, res) => {
  try {
    const { category, sort, page, limit } = req.query;

    const filter = {};
    if (category) {
      const normalizedCategory = normalizeCategory(category);
      if (normalizedCategory !== 'all') {
        filter.category = normalizedCategory;
      }
    }

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

    const normalizedProducts = products.map(normalizeProduct);

    return res.status(200).json({
      success: true,
      count: normalizedProducts.length,
      totalProducts,
      currentPage: page ? currentPage : 1,
      totalPages: page ? totalPages : 1,
      products: normalizedProducts,
    });
  } catch (error) {
    console.error('Get all products error:', error.message);
    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

// Get admin products with strict pagination (default 5 per page)
const getAdminProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 5, 1);
    const category = req.query.category;
    const stockStatus = req.query.stockStatus;
    const skip = (page - 1) * limit;

    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    if (stockStatus && stockStatus !== 'all') {
      if (stockStatus === 'out_of_stock') {
        filter.stock = 0;
      } else if (stockStatus === 'low_stock') {
        filter.stock = { $gt: 0, $lte: 10 };
      } else if (stockStatus === 'in_stock') {
        filter.stock = { $gt: 10 };
      }
    }

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = totalProducts > 0 ? Math.ceil(totalProducts / limit) : 1;
    const safePage = Math.min(page, totalPages);
    const safeSkip = (safePage - 1) * limit;

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(safeSkip)
      .limit(limit);

    const normalizedProducts = products.map(normalizeProduct);

    return res.status(200).json({
      success: true,
      products: normalizedProducts,
      count: normalizedProducts.length,
      totalProducts,
      currentPage: safePage,
      totalPages,
      limit,
    });
  } catch (error) {
    console.error('Get admin products error:', error.message);
    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
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
      product: normalizeProduct(product),
    });
  } catch (error) {
    console.error('Get product error:', error.message);
    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
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
    const allowedFields = ['name', 'price', 'discountPrice', 'description', 'category', 'stock', 'imageUrl', 'brand', 'sku', 'showOnHome'];
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

    if (updates.category !== undefined) {
      updates.category = normalizeCategory(updates.category);

      if (!isOfficialCategory(updates.category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Allowed categories: ${OFFICIAL_CATEGORIES.join(', ')}`,
        });
      }
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

    if (updates.showOnHome !== undefined) {
      updates.showOnHome = parseBoolean(updates.showOnHome, false);
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
      product: normalizeProduct(product),
    });
  } catch (error) {
    console.error('Update product error:', error.message);
    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

// Get featured home products (max 8)
const getHomeProducts = async (req, res) => {
  try {
    const products = await Product.find({ showOnHome: true })
      .sort({ createdAt: -1 })
      .limit(8);

    const normalizedProducts = products.map(normalizeProduct);

    return res.status(200).json({
      success: true,
      count: normalizedProducts.length,
      products: normalizedProducts,
    });
  } catch (error) {
    console.error('Get home products error:', error.message);
    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

// Toggle home page visibility for a product
const toggleHomeProduct = async (req, res) => {
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

    product.showOnHome = !product.showOnHome;
    await product.save();

    return res.status(200).json({
      success: true,
      message: product.showOnHome ? 'Product is now visible on home page' : 'Product removed from home page',
      product: normalizeProduct(product),
    });
  } catch (error) {
    console.error('Toggle home product error:', error.message);
    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
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
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const distinctCategories = await Product.distinct('category');
    const categorySet = new Set(
      distinctCategories
        .map(normalizeCategory)
        .filter((category) => OFFICIAL_CATEGORIES.includes(category))
    );

    // Always return the unified five-category set so the footer and product page
    // stay consistent even when some categories currently have no products.
    const categories = OFFICIAL_CATEGORIES.filter((category) => categorySet.has(category) || true);

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error('Get categories error:', error.message);
    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const normalizedCategory = normalizeCategory(category);

    if (!isOfficialCategory(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed categories: ${OFFICIAL_CATEGORIES.join(', ')}`,
      });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 6, 1);
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'newest';

    let sortObj = { createdAt: -1 };
    switch (String(sort).toLowerCase()) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    const filter = { category: normalizedCategory };
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = totalProducts > 0 ? Math.ceil(totalProducts / limit) : 1;
    const safePage = Math.min(page, totalPages);
    const safeSkip = (safePage - 1) * limit;

    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(safeSkip)
      .limit(limit);

    const normalizedProducts = products.map(normalizeProduct);

    return res.status(200).json({
      success: true,
      category: normalizedCategory,
      count: normalizedProducts.length,
      totalProducts,
      currentPage: safePage,
      totalPages,
      limit,
      products: normalizedProducts,
    });
  } catch (error) {
    console.error('Get products by category error:', error.message);
    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

module.exports = {
  createProduct,
  getAdminProducts,
  getAllProducts,
  getCategories,
  getHomeProducts,
  getProductById,
  getProductsByCategory,
  toggleHomeProduct,
  updateProduct,
  deleteProduct,
};
