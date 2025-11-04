const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const Commission = require('../models/Commission');
const { sendWelcomeEmailWithGUID } = require('../services/emailService');
const CommissionService = require('../services/commissionService');

// Get user's network statistics
const getNetworkStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update network stats
    const networkStats = await user.updateNetworkStats();
    
    // Get direct referrals (approved users)
    const directReferrals = await user.getDirectReferrals();
    
    // Get pending members submitted by this user
    const pendingMembers = await PendingUser.find({ 
      submittedBy: userId 
    }).select('username email firstName lastName phone position status submittedAt referralCode');

    // Get all team members (approved + pending)
    const allTeamMembers = [
      ...directReferrals.map(member => ({
        ...member.toObject(),
        status: 'approved',
        type: 'user'
      })),
      ...pendingMembers.map(member => ({
        ...member.toObject(),
        type: 'pending'
      }))
    ].sort((a, b) => new Date(b.submittedAt || b.joinDate) - new Date(a.submittedAt || a.joinDate));
    
    // Get recent network activity
    const recentCommissions = await Commission.find({
      toUserId: userId,
      type: { $in: ['referral', 'network', 'bonus'] }
    })
    .populate('fromUserId', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        networkStats,
        directReferrals: allTeamMembers,
        recentCommissions,
        referralCode: user.referralCode
      }
    });
  } catch (error) {
    console.error('Error getting network stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a new member to the network
const addNetworkMember = async (req, res) => {
  try {
    const { username, email, firstName, lastName, phone, position } = req.body;
    const sponsorId = req.user.id;
    
    // Validate required fields
    if (!username || !email || !firstName || !lastName) {
      return res.status(400).json({ 
        message: 'Username, email, first name, and last name are required' 
      });
    }

    // Validate username length
    if (username.length < 3) {
      return res.status(400).json({ 
        message: 'Username must be at least 3 characters long' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Get sponsor user
    const sponsor = await User.findById(sponsorId);
    if (!sponsor) {
      return res.status(404).json({ message: 'Sponsor not found' });
    }

    // Create new user
    const newUser = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone ? phone.trim() : '',
      sponsorId,
      position: position || null,
      level: sponsor.level + 1
    });

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).substring(2, 10);
    newUser.password = tempPassword;

    await newUser.save();

    // Update sponsor's network stats
    await sponsor.updateNetworkStats();

    // Add referral reward to sponsor using new commission service
    const referralReward = 50; // $50 for each direct referral
    await CommissionService.processReferralCommission({
      newUserId: newUser._id,
      sponsorId: sponsorId,
      signupBonus: referralReward
    });

    // Update all upline sponsors' network stats and give bonuses
    await updateUplineNetworkStats(sponsorId, newUser._id);

    // Send welcome email with GUID
    try {
      const emailResult = await sendWelcomeEmailWithGUID({
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }, newUser.guid, 'full');
      
      if (emailResult.success) {
        console.log('Welcome email sent successfully to new network member:', newUser.email);
      } else {
        console.error('Failed to send welcome email to new network member:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending welcome email to new network member:', emailError);
      // Don't fail the operation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Network member added successfully',
      data: {
        newUser: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          referralCode: newUser.referralCode,
          guid: newUser.guid,
          tempPassword
        },
        reward: referralReward
      }
    });
  } catch (error) {
    console.error('Error adding network member:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Username or email already exists' 
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// Update upline network stats and give bonuses
const updateUplineNetworkStats = async (sponsorId, newMemberId) => {
  try {
    let currentSponsorId = sponsorId;
    let level = 1;
    const maxLevels = 5; // Maximum levels for bonuses

    while (currentSponsorId && level <= maxLevels) {
      const sponsor = await User.findById(currentSponsorId);
      if (!sponsor) break;

      // Update network stats
      await sponsor.updateNetworkStats();

      // Give level bonus (decreasing with each level)
      const levelBonus = Math.max(10 - (level * 2), 2); // $10, $8, $6, $4, $2
      await sponsor.addNetworkReward(levelBonus, `level_${level}_bonus`);

      // Move to next level
      currentSponsorId = sponsor.sponsorId;
      level++;
    }
  } catch (error) {
    console.error('Error updating upline stats:', error);
  }
};

// Get network tree
const getNetworkTree = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const networkTree = await buildNetworkTree(userId, 0, 3); // 3 levels deep

    res.json({
      success: true,
      data: networkTree
    });
  } catch (error) {
    console.error('Error getting network tree:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Build network tree recursively
const buildNetworkTree = async (userId, currentLevel, maxLevel) => {
  if (currentLevel >= maxLevel) return null;

  const user = await User.findById(userId).select('username firstName lastName email joinDate isActive networkStats');
  if (!user) return null;

  const directReferrals = await User.find({ sponsorId: userId }).select('_id');
  
  const children = [];
  for (const referral of directReferrals) {
    const childTree = await buildNetworkTree(referral._id, currentLevel + 1, maxLevel);
    if (childTree) {
      children.push(childTree);
    }
  }

  return {
    id: user._id,
    username: user.username,
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    joinDate: user.joinDate,
    isActive: user.isActive,
    networkStats: user.networkStats,
    level: currentLevel,
    children
  };
};

// Get referral link
const getReferralLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('referralCode username');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${user.referralCode}`;

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error getting referral link:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get network performance analytics
const getNetworkAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get network growth over time
    const networkGrowth = await getNetworkGrowthAnalytics(userId);
    
    // Get top performers in network
    const topPerformers = await getTopPerformers(userId);
    
    // Get monthly earnings from network
    const monthlyEarnings = await getMonthlyNetworkEarnings(userId);

    res.json({
      success: true,
      data: {
        networkGrowth,
        topPerformers,
        monthlyEarnings
      }
    });
  } catch (error) {
    console.error('Error getting network analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get network growth analytics
const getNetworkGrowthAnalytics = async (userId) => {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const networkGrowth = await User.aggregate([
    {
      $match: {
        $or: [
          { _id: userId },
          { sponsorId: userId }
        ]
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt"
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return networkGrowth;
};

// Helper function to get top performers
const getTopPerformers = async (userId) => {
  return await User.find({ sponsorId: userId })
    .select('username firstName lastName networkStats totalEarnings')
    .sort({ 'networkStats.totalNetwork': -1 })
    .limit(5);
};

// Helper function to get monthly network earnings
const getMonthlyNetworkEarnings = async (userId) => {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  return await Commission.aggregate([
    {
      $match: {
        toUserId: userId,
        type: { $in: ['referral', 'network', 'bonus'] },
        createdAt: { $gte: currentMonth }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = {
  getNetworkStats,
  addNetworkMember,
  getNetworkTree,
  getReferralLink,
  getNetworkAnalytics
};
