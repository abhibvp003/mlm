const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position: {
    type: String,
    default: null
  },
  referralCode: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  }
}, {
  timestamps: true
});

// Generate referral code before saving
pendingUserSchema.pre('save', async function(next) {
  try {
    // Generate referral code if not exists
    if (!this.referralCode) {
      let code;
      let isUnique = false;
      
      while (!isUnique) {
        // Generate a 6-character alphanumeric code
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const existingUser = await this.constructor.findOne({ referralCode: code });
        const existingPendingUser = await mongoose.model('PendingUser').findOne({ referralCode: code });
        if (!existingUser && !existingPendingUser) {
          isUnique = true;
        }
      }
      
      this.referralCode = code;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Get full name
pendingUserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('PendingUser', pendingUserSchema);
