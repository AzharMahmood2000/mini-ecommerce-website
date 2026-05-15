const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Feature key is required'],
      unique: true,
      trim: true,
      enum: ['safe_payment', 'easy_exchange', 'fast_delivery'],
    },
    title: {
      type: String,
      required: [true, 'Feature title is required'],
      trim: true,
      maxlength: [80, 'Feature title cannot exceed 80 characters'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [300, 'Feature message cannot exceed 300 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Feature', featureSchema);
