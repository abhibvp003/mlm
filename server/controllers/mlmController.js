const User = require('../models/User');
const Commission = require('../models/Commission');
const MLMLogic = require('../utils/mlmLogic');

// Get genealogy tree
const getGenealogyTree = async (req, res) => {
  try {
    const { userId } = req.params;
    const { maxLevel = 5 } = req.query;

    // Check if user is requesting their own tree or is admin
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const tree = await MLMLogic.getGenealogyTree(userId, parseInt(maxLevel));
    
    if (!tree) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      message: 'Genealogy tree retrieved successfully',
      tree
    });
  } catch (error) {
    console.error('Get genealogy tree error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get team statistics
const getTeamStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is requesting their own stats or is admin
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const stats = await MLMLogic.getTeamStats(userId);
    
    if (!stats) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      message: 'Team statistics retrieved successfully',
      stats
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get commission history
const getCommissionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    // Check if user is requesting their own history or is admin
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const result = await MLMLogic.getCommissionHistory(
      userId, 
      parseInt(limit), 
      parseInt(page)
    );

    res.json({
      message: 'Commission history retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Get commission history error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get downline members
const getDownlineMembers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { level = 1, limit = 50, page = 1 } = req.query;

    // Check if user is requesting their own downline or is admin
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const skip = (page - 1) * limit;
    
    // Get direct downline members
    const members = await User.find({ sponsorId: userId })
      .select('username firstName lastName email phone level totalEarnings isActive joinDate')
      .sort({ joinDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({ sponsorId: userId });

    res.json({
      message: 'Downline members retrieved successfully',
      members,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get downline members error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get upline path
const getUplinePath = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is requesting their own upline or is admin
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const uplinePath = await user.getGenealogyPath();

    res.json({
      message: 'Upline path retrieved successfully',
      uplinePath
    });
  } catch (error) {
    console.error('Get upline path error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get earnings summary
const getEarningsSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 'month' } = req.query; // month, week, year

    // Check if user is requesting their own earnings or is admin
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get commissions for the period
    const commissions = await Commission.find({
      userId,
      createdAt: { $gte: startDate },
      status: { $in: ['approved', 'paid'] }
    });

    // Calculate summary
    const summary = {
      totalEarnings: user.totalEarnings,
      periodEarnings: commissions.reduce((sum, comm) => sum + comm.amount, 0),
      totalCommissions: commissions.length,
      commissionBreakdown: {
        direct: commissions.filter(c => c.type === 'direct').reduce((sum, c) => sum + c.amount, 0),
        binary: commissions.filter(c => c.type === 'binary').reduce((sum, c) => sum + c.amount, 0),
        matching: commissions.filter(c => c.type === 'matching').reduce((sum, c) => sum + c.amount, 0),
        leadership: commissions.filter(c => c.type === 'leadership').reduce((sum, c) => sum + c.amount, 0)
      }
    };

    res.json({
      message: 'Earnings summary retrieved successfully',
      summary,
      period
    });
  } catch (error) {
    console.error('Get earnings summary error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getGenealogyTree,
  getTeamStats,
  getCommissionHistory,
  getDownlineMembers,
  getUplinePath,
  getEarningsSummary
};
