const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      validate: {
        validator: function (value) {
          return value <= this.price;
        },
        message: 'Discount price cannot be greater than original price',
      },
      default: null,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
      required: [true, 'Category is required'],
      enum: ['Mobile Devices', 'Audio Systems', 'Information Systems', 'Gaming'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (value) {
          if (value === '') return true;
          // Allow either full http(s) URL or a server-relative uploads path
          return /^(?:https?:\/\/.+\.(?:jpg|jpeg|png|gif|webp)$|(?:\/uploads\/.*\.(?:jpg|jpeg|png|gif|webp)$))/i.test(value);
        },
        message: 'Invalid image URL or uploads path format',
      },
    },
    imageUrls: {
      type: [String],
      default: [],
      validate: {
        validator: function (value) {
          if (!Array.isArray(value)) return false;
          return value.every((url) =>
            /^(?:https?:\/\/.+\.(?:jpg|jpeg|png|gif|webp)$|(?:\/uploads\/.*\.(?:jpg|jpeg|png|gif|webp)$))/i.test(url)
          );
        },
        message: 'All image URLs must be valid URLs or uploads paths',
      },
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
      default: 0,
    },
    reviewCount: {
      type: Number,
      min: [0, 'Review count cannot be negative'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sku: {
      type: String,
      trim: true,
      default: undefined,
      maxlength: [80, 'SKU cannot exceed 80 characters'],
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, 'Brand name cannot exceed 50 characters'],
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index(
  { sku: 1 },
  {
    unique: true,
    name: 'sku_unique_partial',
    partialFilterExpression: {
      sku: { $type: 'string', $ne: '' },
    },
  }
);

module.exports = mongoose.model('Product', productSchema);
