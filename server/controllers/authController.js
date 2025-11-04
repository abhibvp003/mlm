const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const MLMLogic = require('../utils/mlmLogic');
const { sendWelcomeEmailWithGUID } = require('../services/emailService');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register new user (admin only - direct registration)
const register = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        message: 'Access denied. Only admins can directly register users.'
      });
    }

    const { username, email, password, firstName, lastName, phone, sponsorId, position, address, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    let sponsor = null;
    let sponsorIdToUse = sponsorId;

    // Handle referral code
    if (referralCode) {
      sponsor = await User.findOne({ referralCode });
      if (!sponsor) {
        return res.status(400).json({
          message: 'Invalid referral code'
        });
      }
      if (!sponsor.isActive) {
        return res.status(400).json({
          message: 'Referral code belongs to an inactive account'
        });
      }
      sponsorIdToUse = sponsor._id;
    }

    // Validate sponsor if provided
    if (sponsorIdToUse) {
      if (!sponsor) {
        sponsor = await User.findById(sponsorIdToUse);
      }
      if (!sponsor) {
        return res.status(400).json({
          message: 'Invalid sponsor ID'
        });
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      sponsorId: sponsorIdToUse || null,
      position: position || null,
      address: address || {},
      level: sponsor ? sponsor.level + 1 : 0
    });

    await user.save();

    // Process MLM logic if sponsor is provided
    if (sponsorIdToUse) {
      await MLMLogic.processNewMember(user._id, sponsorIdToUse, position);
    }

    // Add network reward for sponsor if they referred this user
    if (sponsor) {
      await sponsor.addNetworkReward(50, 'referral'); // $50 for direct referral
      await sponsor.updateNetworkStats();
    }

    // Send welcome email with GUID
    try {
      const emailResult = await sendWelcomeEmailWithGUID({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }, user.guid, 'full');
      
      if (emailResult.success) {
        console.log('Welcome email sent successfully to:', user.email);
      } else {
        console.error('Failed to send welcome email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        guid: user.guid
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// Submit new member for approval (regular users)
const submitMember = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, sponsorId, position, address, referralCode } = req.body;
    const submittedBy = req.user.id;

    // Check if user already exists in User collection
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    // Check if user already exists in PendingUser collection
    const existingPendingUser = await PendingUser.findOne({
      $or: [{ email }, { username }]
    });

    if (existingPendingUser) {
      return res.status(400).json({
        message: 'A registration request for this email or username is already pending'
      });
    }

    let sponsor = null;
    let sponsorIdToUse = sponsorId;

    // Handle referral code
    if (referralCode) {
      sponsor = await User.findOne({ referralCode });
      if (!sponsor) {
        return res.status(400).json({
          message: 'Invalid referral code'
        });
      }
      if (!sponsor.isActive) {
        return res.status(400).json({
          message: 'Referral code belongs to an inactive account'
        });
      }
      sponsorIdToUse = sponsor._id;
    }

    // If no sponsorId provided, use the current user as sponsor
    if (!sponsorIdToUse) {
      sponsorIdToUse = submittedBy;
    }

    // Validate sponsor
    if (!sponsor) {
      sponsor = await User.findById(sponsorIdToUse);
    }
    if (!sponsor) {
      return res.status(400).json({
        message: 'Invalid sponsor ID'
      });
    }

    // Position is now optional - no validation needed

    // Create pending user
    const pendingUser = new PendingUser({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      address: address || {},
      sponsorId: sponsorIdToUse,
      position,
      submittedBy
    });

    await pendingUser.save();

    res.status(201).json({
      message: 'Member registration submitted for approval',
      data: {
        id: pendingUser._id,
        username: pendingUser.username,
        email: pendingUser.email,
        firstName: pendingUser.firstName,
        lastName: pendingUser.lastName,
        status: pendingUser.status,
        submittedAt: pendingUser.submittedAt
      }
    });
  } catch (error) {
    console.error('Submit member error:', error);
    res.status(500).json({
      message: 'Server error during member submission',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account is deactivated'
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        totalEarnings: user.totalEarnings
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login',
      error: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Get genealogy path
    const genealogyPath = await user.getGenealogyPath();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        sponsorId: user.sponsorId,
        position: user.position,
        level: user.level,
        totalEarnings: user.totalEarnings,
        totalCommissions: user.totalCommissions,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        joinDate: user.joinDate,
        lastLogin: user.lastLogin,
        genealogyPath
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Validate referral code
const validateReferral = async (req, res) => {
  try {
    const { referralCode } = req.params;
    
    const user = await User.findOne({ referralCode }).select('username firstName lastName email isActive');
    
    if (!user) {
      return res.status(404).json({
        message: 'Invalid referral code'
      });
    }
    
    if (!user.isActive) {
      return res.status(400).json({
        message: 'Referral code belongs to an inactive account'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error validating referral:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  submitMember,
  login,
  getProfile,
  updateProfile,
  validateReferral
};
