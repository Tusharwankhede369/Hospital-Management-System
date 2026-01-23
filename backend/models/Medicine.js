const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['tablet', 'syrup', 'injection', 'capsule', 'drops'],
    required: true
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number
  },
  manufacturer: {
    type: String
  },
  expiryDate: {
    type: Date
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Medicine', medicineSchema);

