const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: false,
    min: 0,
    max: 100
  },
  level: {
    type: Number,
    required: false,
    min: 1
  },
  type: {
    type: String,
    enum: [
      'direct', 'binary', 'matching', 'leadership', 'referral', 'network_bonus', 
      'level_1_bonus', 'level_2_bonus', 'level_3_bonus', 'level_4_bonus', 'level_5_bonus',
      'signup_bonus', 'product_sale', 'team_building', 'performance_bonus', 'monthly_bonus'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['referral', 'product_purchase', 'team_activity', 'bonus', 'admin_adjustment'],
    required: true
  },
  sourceDetails: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false
    },
    referralUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    originalAmount: {
      type: Number,
      required: false
    },
    commissionRate: {
      type: Number,
      required: false
    }
  },
  breakdown: {
    baseAmount: {
      type: Number,
      required: false
    },
    commissionRate: {
      type: Number,
      required: false
    },
    calculatedAmount: {
      type: Number,
      required: false
    },
    bonusAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  paidDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
commissionSchema.index({ toUserId: 1, createdAt: -1 });
commissionSchema.index({ fromUserId: 1, createdAt: -1 });
commissionSchema.index({ status: 1 });

module.exports = mongoose.model('Commission', commissionSchema);
