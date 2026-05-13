const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');

// Load .env file
dotenv.config();

// Create app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    error: err.message,
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

// Function to insert sample data
const insertSampleData = async () => {
  try {
    // Check if any products already exist
    const existingProduct = await Product.findOne();
    
    if (existingProduct) {
      console.log('Sample data already exists. Skipping insertion.');
      return;
    }

    // Sample product data
    const sampleProduct = new Product({
      name: 'iPhone 17 Pro Max',
      price: 300000,
      description: 'Experience the pinnacle of mobile technology with the iPhone 17 Pro Max. Featuring an advanced titanium design, ultra-fast processing speeds, and a stunning triple-lens camera system.',
      category: 'Mobile Devices',
      stock: 50,
    });

    // Save to database
    await sampleProduct.save();
    console.log('Sample product inserted successfully:', sampleProduct.name);
  } catch (error) {
    console.error('Error inserting sample data:', error.message);
  }
};

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

    // Insert sample data after connection
    await insertSampleData();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();