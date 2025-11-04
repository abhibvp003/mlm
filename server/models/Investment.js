const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['basic', 'premium', 'platinum'],
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 60 // months
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed'],
    default: 'pending'
  },
  expectedReturns: {
    type: Number,
    default: 0
  },
  maturityDate: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  actualReturns: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Calculate maturity date before saving
investmentSchema.pre('save', function(next) {
  if (this.isNew && this.duration) {
    const startDate = new Date();
    this.maturityDate = new Date(startDate.getTime() + (this.duration * 30 * 24 * 60 * 60 * 1000)); // Approximate months to milliseconds
  }
  next();
});

// Index for better query performance
investmentSchema.index({ userId: 1, createdAt: -1 });
investmentSchema.index({ status: 1, submittedAt: -1 });

module.exports = mongoose.model('Investment', investmentSchema);
