const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');

// Public routes - Get all active products
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = { isActive: true };
    if (category) filter.category = category;

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      message: 'Products retrieved successfully',
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.json({
      message: 'Product retrieved successfully',
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Admin routes - Create product
router.post('/', auth, adminAuth, validateProduct, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Admin routes - Update product
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Admin routes - Delete product
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
