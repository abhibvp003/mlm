const PendingUser = require('../models/PendingUser');
const User = require('../models/User');
const MLMLogic = require('../utils/mlmLogic');
const { sendWelcomeEmailWithGUID } = require('../services/emailService');

// Get all pending users for admin review
const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await PendingUser.find({ status: 'pending' })
      .populate('sponsorId', 'username firstName lastName email')
      .populate('submittedBy', 'username firstName lastName email')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: pendingUsers
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending users',
      error: error.message
    });
  }
};

// Get all users (pending, approved, rejected) for admin review
const getAllPendingUsers = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const pendingUsers = await PendingUser.find(query)
      .populate('sponsorId', 'username firstName lastName email')
      .populate('submittedBy', 'username firstName lastName email')
      .populate('reviewedBy', 'username firstName lastName email')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PendingUser.countDocuments(query);

    res.json({
      success: true,
      data: pendingUsers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching all pending users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending users',
      error: error.message
    });
  }
};

// Approve a pending user
const approveUser = async (req, res) => {
  try {
    const { pendingUserId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    // Find the pending user
    const pendingUser = await PendingUser.findById(pendingUserId);
    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        message: 'Pending user not found'
      });
    }

    if (pendingUser.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'User has already been processed'
      });
    }

    // Check if sponsor still exists and is active
    const sponsor = await User.findById(pendingUser.sponsorId);
    if (!sponsor || !sponsor.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Sponsor is no longer active'
      });
    }

    // Check if position is available
    const existingUserInPosition = await User.findOne({
      sponsorId: pendingUser.sponsorId,
      position: pendingUser.position
    });

    if (existingUserInPosition) {
      return res.status(400).json({
        success: false,
        message: `Position ${pendingUser.position} is already occupied under this sponsor`
      });
    }

    // Create the new user
    const newUser = new User({
      username: pendingUser.username,
      email: pendingUser.email,
      password: pendingUser.password,
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      phone: pendingUser.phone,
      address: pendingUser.address,
      sponsorId: pendingUser.sponsorId,
      position: pendingUser.position,
      level: sponsor.level + 1,
      referralCode: pendingUser.referralCode
    });

    await newUser.save();

    // Process MLM logic
    await MLMLogic.processNewMember(newUser._id, pendingUser.sponsorId, pendingUser.position);

    // Add network reward for sponsor
    await sponsor.addNetworkReward(50, 'referral');
    await sponsor.updateNetworkStats();

    // Delete the pending user since it's now been converted to an actual user
    await PendingUser.findByIdAndDelete(pendingUser._id);

    // Send welcome email
    try {
      const emailResult = await sendWelcomeEmailWithGUID({
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }, newUser.guid, 'full');
      
      if (emailResult.success) {
        console.log('Welcome email sent successfully to:', newUser.email);
      } else {
        console.error('Failed to send welcome email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    res.json({
      success: true,
      message: 'User approved successfully',
      data: {
        pendingUser: pendingUser,
        newUser: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        }
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving user',
      error: error.message
    });
  }
};

// Reject a pending user
const rejectUser = async (req, res) => {
  try {
    const { pendingUserId } = req.params;
    const { rejectionReason, notes } = req.body;
    const adminId = req.user.id;

    // Find the pending user
    const pendingUser = await PendingUser.findById(pendingUserId);
    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        message: 'Pending user not found'
      });
    }

    if (pendingUser.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'User has already been processed'
      });
    }

    // Update pending user status
    pendingUser.status = 'rejected';
    pendingUser.reviewedBy = adminId;
    pendingUser.reviewedAt = new Date();
    pendingUser.rejectionReason = rejectionReason;
    pendingUser.notes = notes;
    await pendingUser.save();

    res.json({
      success: true,
      message: 'User rejected successfully',
      data: pendingUser
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting user',
      error: error.message
    });
  }
};

// Get pending user details
const getPendingUserDetails = async (req, res) => {
  try {
    const { pendingUserId } = req.params;

    const pendingUser = await PendingUser.findById(pendingUserId)
      .populate('sponsorId', 'username firstName lastName email phone address')
      .populate('submittedBy', 'username firstName lastName email')
      .populate('reviewedBy', 'username firstName lastName email');

    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        message: 'Pending user not found'
      });
    }

    res.json({
      success: true,
      data: pendingUser
    });
  } catch (error) {
    console.error('Error fetching pending user details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending user details',
      error: error.message
    });
  }
};

// Get approval statistics
const getApprovalStats = async (req, res) => {
  try {
    const stats = await PendingUser.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching approval statistics',
      error: error.message
    });
  }
};

module.exports = {
  getPendingUsers,
  getAllPendingUsers,
  approveUser,
  rejectUser,
  getPendingUserDetails,
  getApprovalStats
};
