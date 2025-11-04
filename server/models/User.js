const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
    default: null
  },
  position: {
    type: String,
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalCommissions: {
    type: Number,
    default: 0
  },
  networkStats: {
    totalMembers: {
      type: Number,
      default: 0
    },
    directReferrals: {
      type: Number,
      default: 0
    },
    totalNetwork: {
      type: Number,
      default: 0
    },
    networkRewards: {
      type: Number,
      default: 0
    }
  },
  referralCode: {
    type: String,
    unique: true,
    required: false
  },
  guid: {
    type: String,
    unique: true,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate referral code and GUID before saving
userSchema.pre('save', async function(next) {
  try {
    // Generate referral code if not exists
    if (!this.referralCode) {
      let code;
      let isUnique = false;
      
      while (!isUnique) {
        // Generate a 6-character alphanumeric code
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const existingUser = await this.constructor.findOne({ referralCode: code });
        if (!existingUser) {
          isUnique = true;
        }
      }
      
      this.referralCode = code;
    }

    // Generate GUID if not exists
    if (!this.guid) {
      const { generateGUID } = require('../utils/guidGenerator');
      let guid;
      let isUnique = false;
      
      while (!isUnique) {
        guid = generateGUID();
        const existingUser = await this.constructor.findOne({ guid: guid });
        if (!existingUser) {
          isUnique = true;
        }
      }
      
      this.guid = guid;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Get genealogy path
userSchema.methods.getGenealogyPath = async function() {
  const path = [];
  let currentUser = this;
  
  while (currentUser.sponsorId) {
    currentUser = await this.constructor.findById(currentUser.sponsorId);
    if (currentUser) {
      path.unshift({
        id: currentUser._id,
        username: currentUser.username,
        fullName: currentUser.fullName
      });
    } else {
      break;
    }
  }
  
  return path;
};

// Get direct referrals
userSchema.methods.getDirectReferrals = async function() {
  return await this.constructor.find({ sponsorId: this._id }).select('username firstName lastName email joinDate isActive');
};

// Get total network count (all levels)
userSchema.methods.getTotalNetworkCount = async function() {
  const countDirectReferrals = async (userId) => {
    const directReferrals = await this.constructor.find({ sponsorId: userId }).select('_id');
    let total = directReferrals.length;
    
    for (const referral of directReferrals) {
      total += await countDirectReferrals(referral._id);
    }
    
    return total;
  };
  
  return await countDirectReferrals(this._id);
};

// Update network stats
userSchema.methods.updateNetworkStats = async function() {
  const directReferrals = await this.getDirectReferrals();
  const totalNetwork = await this.getTotalNetworkCount();
  
  this.networkStats.directReferrals = directReferrals.length;
  this.networkStats.totalNetwork = totalNetwork;
  this.networkStats.totalMembers = totalNetwork;
  
  await this.save();
  return this.networkStats;
};

// Add network reward
userSchema.methods.addNetworkReward = async function(amount, type = 'referral') {
  this.networkStats.networkRewards += amount;
  this.totalEarnings += amount;
  await this.save();
  
  // Create commission record
  const Commission = require('./Commission');
  await Commission.create({
    fromUserId: this._id,
    toUserId: this._id,
    amount: amount,
    type: type,
    description: `Network reward for ${type}`,
    source: 'referral',
    breakdown: {
      totalAmount: amount
    }
  });
  
  return this.networkStats;
};

module.exports = mongoose.model('User', userSchema);
