const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const homeProductsRoutes = require('./routes/homeProductsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const featureRoutes = require('./routes/featureRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { ensureDefaultFeatures } = require('./controllers/featureController');

// Load .env file
dotenv.config();

// Create app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "Backend is working!"
  });
});

// User routes
app.use('/api/users', userRoutes);
console.log(' User routes loaded: /api/users');

// Product routes
app.use('/api/products', productRoutes);
console.log(' Product routes loaded: /api/products');

// Admin routes
app.use('/api/admin', adminRoutes);
console.log(' Admin routes loaded: /api/admin');

// Home products route
app.use('/api/home-products', homeProductsRoutes);
console.log(' Home products route loaded: /api/home-products');

// Categories route
app.use('/api/categories', categoryRoutes);
console.log(' Categories route loaded: /api/categories');

// Features route
app.use('/api/features', featureRoutes);
console.log(' Features route loaded: /api/features');

// Cart route
app.use('/api/cart', cartRoutes);
console.log(' Cart route loaded: /api/cart');

// Orders route
app.use('/api/orders', orderRoutes);
console.log(' Orders route loaded: /api/orders');

// Simple test POST endpoint
app.post('/test-api', (req, res) => {
  console.log(' TEST POST endpoint received request');
  res.json({ success: true, message: 'Test POST works!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(' ERROR:', err.message);
  console.error(' Stack:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later',
  });
});

// 404 handler
app.use((req, res) => {
  console.log(' 404 - Route not found:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Remove old product indexes that no longer match the schema
const removeLegacyProductIndexes = async () => {
  try {
    const indexes = await Product.collection.indexes();
    const hasSkuIndex = indexes.some((index) => index.name === 'sku_1');

    if (hasSkuIndex) {
      await Product.collection.dropIndex('sku_1');
      console.log('Removed legacy sku_1 index from products collection.');
    }
  } catch (error) {
    if (error.codeName === 'IndexNotFound' || /index not found/i.test(error.message)) {
      return;
    }

    console.error('Error removing legacy product indexes:', error.message);
  }
};

// Server start
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();

    console.log('Connected database:', mongoose.connection.name);
    console.log('Connected host:', mongoose.connection.host);

    await removeLegacyProductIndexes();
    await ensureDefaultFeatures();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();