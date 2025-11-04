const mongoose = require('mongoose');
const Commission = require('../models/Commission');
const CommissionService = require('../services/commissionService');

// Get detailed commission history for a user
const getCommissionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, page = 1 } = req.query;

    const result = await CommissionService.getCommissionHistory(
      userId, 
      parseInt(limit), 
      parseInt(page)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting commission history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission history',
      error: error.message
    });
  }
};

// Get commission summary with breakdown by type
const getCommissionSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const summary = await CommissionService.getCommissionSummary(userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting commission summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission summary',
      error: error.message
    });
  }
};

// Get commission details by ID
const getCommissionDetails = async (req, res) => {
  try {
    const { commissionId } = req.params;
    const userId = req.user.id;

    const commission = await Commission.findOne({
      _id: commissionId,
      toUserId: userId
    })
    .populate('fromUserId', 'username firstName lastName email')
    .populate('sourceDetails.productId', 'name price')
    .populate('sourceDetails.orderId', 'orderNumber totalAmount')
    .populate('sourceDetails.referralUserId', 'username firstName lastName email');

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    res.json({
      success: true,
      data: commission
    });
  } catch (error) {
    console.error('Error getting commission details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission details',
      error: error.message
    });
  }
};

// Get earnings breakdown by source
const getEarningsBreakdown = async (req, res) => {
  try {
    const userId = req.user.id;

    const breakdown = await Commission.aggregate([
      { $match: { toUserId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$source',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          types: { $addToSet: '$type' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const monthlyBreakdown = await Commission.aggregate([
      { $match: { toUserId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        sourceBreakdown: breakdown,
        monthlyBreakdown: monthlyBreakdown
      }
    });
  } catch (error) {
    console.error('Error getting earnings breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings breakdown',
      error: error.message
    });
  }
};

// Get recent commissions
const getRecentCommissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const commissions = await Commission.find({ toUserId: userId })
      .populate('fromUserId', 'username firstName lastName')
      .populate('sourceDetails.referralUserId', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: commissions
    });
  } catch (error) {
    console.error('Error getting recent commissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent commissions',
      error: error.message
    });
  }
};

module.exports = {
  getCommissionHistory,
  getCommissionSummary,
  getCommissionDetails,
  getEarningsBreakdown,
  getRecentCommissions
};
