const Investment = require('../models/Investment');
const User = require('../models/User');

// Submit investment request
const submitInvestment = async (req, res) => {
  try {
    const { amount, type, duration, description } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid investment amount is required'
      });
    }

    if (!type || !['basic', 'premium', 'platinum'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid investment type is required'
      });
    }

    if (!duration || duration < 1 || duration > 60) {
      return res.status(400).json({
        success: false,
        message: 'Investment duration must be between 1 and 60 months'
      });
    }

    // Calculate expected returns based on type and duration
    let expectedReturns = 0;
    switch (type) {
      case 'basic':
        expectedReturns = amount * 0.12 * (duration / 12); // 12% annual
        break;
      case 'premium':
        expectedReturns = amount * 0.18 * (duration / 12); // 18% annual
        break;
      case 'platinum':
        expectedReturns = amount * 0.25 * (duration / 12); // 25% annual
        break;
    }

    // Create investment request
    const investment = new Investment({
      userId,
      amount,
      type,
      duration,
      description,
      expectedReturns,
      status: 'pending'
    });

    await investment.save();

    res.status(201).json({
      success: true,
      message: 'Investment request submitted for approval',
      data: {
        id: investment._id,
        amount: investment.amount,
        type: investment.type,
        duration: investment.duration,
        expectedReturns: investment.expectedReturns,
        status: investment.status,
        submittedAt: investment.submittedAt
      }
    });
  } catch (error) {
    console.error('Error submitting investment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during investment submission',
      error: error.message
    });
  }
};

// Get user's investments
const getUserInvestments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = { userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const investments = await Investment.find(query)
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: investments
    });
  } catch (error) {
    console.error('Error fetching user investments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching investments',
      error: error.message
    });
  }
};

// Get all pending investments (admin only)
const getPendingInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({ status: 'pending' })
      .populate('userId', 'username firstName lastName email')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: investments
    });
  } catch (error) {
    console.error('Error fetching pending investments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending investments',
      error: error.message
    });
  }
};

// Get all investments with pagination and filtering (admin only)
const getAllInvestments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const investments = await Investment.find(query)
      .populate('userId', 'username firstName lastName email')
      .populate('reviewedBy', 'username firstName lastName email')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Investment.countDocuments(query);

    res.json({
      success: true,
      data: investments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching all investments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching investments',
      error: error.message
    });
  }
};

// Approve investment (admin only)
const approveInvestment = async (req, res) => {
  try {
    const { investmentId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const investment = await Investment.findById(investmentId);
    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    if (investment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Investment has already been processed'
      });
    }

    // Update investment status
    investment.status = 'approved';
    investment.reviewedBy = adminId;
    investment.reviewedAt = new Date();
    investment.notes = notes;
    investment.startDate = new Date();

    await investment.save();

    res.json({
      success: true,
      message: 'Investment approved successfully',
      data: investment
    });
  } catch (error) {
    console.error('Error approving investment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving investment',
      error: error.message
    });
  }
};

// Reject investment (admin only)
const rejectInvestment = async (req, res) => {
  try {
    const { investmentId } = req.params;
    const { rejectionReason, notes } = req.body;
    const adminId = req.user.id;

    const investment = await Investment.findById(investmentId);
    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    if (investment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Investment has already been processed'
      });
    }

    // Update investment status
    investment.status = 'rejected';
    investment.reviewedBy = adminId;
    investment.reviewedAt = new Date();
    investment.rejectionReason = rejectionReason;
    investment.notes = notes;

    await investment.save();

    res.json({
      success: true,
      message: 'Investment rejected successfully',
      data: investment
    });
  } catch (error) {
    console.error('Error rejecting investment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting investment',
      error: error.message
    });
  }
};

// Get investment statistics (admin only)
const getInvestmentStats = async (req, res) => {
  try {
    const stats = await Investment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      active: 0,
      completed: 0,
      total: 0,
      totalAmount: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
      formattedStats.totalAmount += stat.totalAmount;
    });

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('Error fetching investment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching investment statistics',
      error: error.message
    });
  }
};

module.exports = {
  submitInvestment,
  getUserInvestments,
  getPendingInvestments,
  getAllInvestments,
  approveInvestment,
  rejectInvestment,
  getInvestmentStats
};
