const Product = require('../models/Product');

const generateSku = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SKU-${timestamp}-${randomPart}`;
};

const normalizeSku = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

// Create a new product
const createProduct = async (req, res) => {
  try {
    console.log(' [CREATE PRODUCT] Request received');
    console.log(' Content-Type:', req.headers['content-type']);
    console.log(' Body:', req.body);

    const {
      name,
      description,
      price,
      discountPrice,
      category,
      stock,
      imageUrl,
      imageUrls,
      brand,
      sku,
      tags,
    } = req.body;

    if (!name || !price || !category || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'name, price, category, and stock are required.',
      });
    }

    const normalizedSku = normalizeSku(sku) || generateSku();

    const existingSkuProduct = await Product.findOne({ sku: normalizedSku });

    if (existingSkuProduct) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists. Please use a different SKU.',
      });
    }

    const newProduct = await Product.create({
      name,
      description: description || '',
      price,
      discountPrice: discountPrice || null,
      category,
      stock,
      imageUrl: imageUrl || '',
      imageUrls: imageUrls || [],
      brand: brand || '',
      sku: normalizedSku,
      tags: tags || [],
    });

    console.log('Product created successfully with id:', newProduct._id);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: newProduct,
    });
  } catch (error) {
    console.error('Create product error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while creating the product.',
    });
  }
};

// Get all products with filters
const getAllProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, isActive, isFeatured } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Get products error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not fetch products.',
    });
  }
};

// Get a single product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
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
      message: error.message || 'Could not fetch product.',
    });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if ('sku' in updates) {
      const normalizedSku = normalizeSku(updates.sku);

      if (!normalizedSku) {
        delete updates.sku;
      } else {
        const skuConflict = await Product.findOne({
          sku: normalizedSku,
          _id: { $ne: id },
        });

        if (skuConflict) {
          return res.status(400).json({
            success: false,
            message: 'SKU already exists. Please use a different SKU.',
          });
        }

        updates.sku = normalizedSku;
      }
    }

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    console.log('Product updated successfully with id:', product._id);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not update product.',
    });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    console.log('Product deleted successfully with id:', product._id);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    console.error('Delete product error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not delete product.',
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
