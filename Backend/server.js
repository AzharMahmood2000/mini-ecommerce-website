const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const userRoutes = require('./routes/userRoutes');

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
      category: 'Mobile Phones',
      stock: 50,
    });

    // Save to database
    await sampleProduct.save();
    console.log('Sample product inserted successfully:', sampleProduct.name);
  } catch (error) {
    console.error('Error inserting sample data:', error.message);
  }
};

// Server start
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();

    console.log('Connected database:', mongoose.connection.name);
    console.log('Connected host:', mongoose.connection.host);

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