const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  pv: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Point Value for commission calculation'
  },
  category: {
    type: String,
    required: true,
    enum: ['product', 'package', 'subscription']
  },
  image: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  commissionRates: {
    direct: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    binary: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    matching: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
