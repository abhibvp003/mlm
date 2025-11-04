const mongoose = require('mongoose');
const Commission = require('../models/Commission');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

class CommissionService {
  
  /**
   * Create a detailed commission record with full breakdown
   */
  static async createCommission({
    toUserId,
    fromUserId,
    amount,
    type,
    source,
    description,
    sourceDetails = {},
    breakdown = {},
    level = null,
    percentage = null
  }) {
    try {
      // Calculate breakdown if not provided
      if (!breakdown.totalAmount) {
        breakdown.totalAmount = amount;
      }

      const commission = new Commission({
        toUserId,
        fromUserId,
        amount,
        type,
        source,
        description,
        sourceDetails,
        breakdown,
        level,
        percentage,
        status: 'approved' // Auto-approve for now
      });

      await commission.save();

      // Update user's total earnings
      await User.findByIdAndUpdate(toUserId, {
        $inc: { 
          totalEarnings: amount,
          totalCommissions: amount
        }
      });

      return commission;
    } catch (error) {
      console.error('Error creating commission:', error);
      throw error;
    }
  }

  /**
   * Process referral commission when a new member joins
   */
  static async processReferralCommission({
    newUserId,
    sponsorId,
    signupBonus = 50
  }) {
    try {
      const sponsor = await User.findById(sponsorId);
      const newUser = await User.findById(newUserId);

      if (!sponsor || !newUser) {
        throw new Error('User not found');
      }

      // Create referral commission
      const commission = await this.createCommission({
        toUserId: sponsorId,
        fromUserId: newUserId,
        amount: signupBonus,
        type: 'referral',
        source: 'referral',
        description: `Referral bonus for bringing ${newUser.firstName} ${newUser.lastName} to the team`,
        sourceDetails: {
          referralUserId: newUserId,
          originalAmount: signupBonus,
          commissionRate: 100
        },
        breakdown: {
          baseAmount: signupBonus,
          commissionRate: 100,
          calculatedAmount: signupBonus,
          bonusAmount: 0,
          totalAmount: signupBonus
        },
        level: 1,
        percentage: 100
      });

      // Update sponsor's network stats
      await sponsor.updateNetworkStats();

      return commission;
    } catch (error) {
      console.error('Error processing referral commission:', error);
      throw error;
    }
  }

  /**
   * Process product sale commission
   */
  static async processProductSaleCommission({
    orderId,
    buyerId,
    productId,
    saleAmount
  }) {
    try {
      const order = await Order.findById(orderId);
      const product = await Product.findById(productId);
      const buyer = await User.findById(buyerId);

      if (!order || !product || !buyer) {
        throw new Error('Order, product, or buyer not found');
      }

      const commissionRate = product.commissionRate || 10; // Default 10%
      const commissionAmount = (saleAmount * commissionRate) / 100;

      // Create product sale commission for buyer's sponsor
      if (buyer.sponsorId) {
        const commission = await this.createCommission({
          toUserId: buyer.sponsorId,
          fromUserId: buyerId,
          amount: commissionAmount,
          type: 'product_sale',
          source: 'product_purchase',
          description: `Product sale commission from ${buyer.firstName} ${buyer.lastName} - ${product.name}`,
          sourceDetails: {
            productId: productId,
            orderId: orderId,
            originalAmount: saleAmount,
            commissionRate: commissionRate
          },
          breakdown: {
            baseAmount: saleAmount,
            commissionRate: commissionRate,
            calculatedAmount: commissionAmount,
            bonusAmount: 0,
            totalAmount: commissionAmount
          },
          level: 1,
          percentage: commissionRate
        });

        return commission;
      }
    } catch (error) {
      console.error('Error processing product sale commission:', error);
      throw error;
    }
  }

  /**
   * Process team building bonus
   */
  static async processTeamBuildingBonus({
    userId,
    teamSize,
    bonusAmount = 25
  }) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const commission = await this.createCommission({
        toUserId: userId,
        fromUserId: userId, // Self-earned
        amount: bonusAmount,
        type: 'team_building',
        source: 'team_activity',
        description: `Team building bonus for reaching ${teamSize} team members`,
        sourceDetails: {
          originalAmount: bonusAmount,
          commissionRate: 100
        },
        breakdown: {
          baseAmount: bonusAmount,
          commissionRate: 100,
          calculatedAmount: bonusAmount,
          bonusAmount: 0,
          totalAmount: bonusAmount
        },
        percentage: 100
      });

      return commission;
    } catch (error) {
      console.error('Error processing team building bonus:', error);
      throw error;
    }
  }

  /**
   * Process performance bonus
   */
  static async processPerformanceBonus({
    userId,
    performanceMetric,
    bonusAmount,
    description
  }) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const commission = await this.createCommission({
        toUserId: userId,
        fromUserId: userId, // Self-earned
        amount: bonusAmount,
        type: 'performance_bonus',
        source: 'bonus',
        description: description || `Performance bonus for ${performanceMetric}`,
        sourceDetails: {
          originalAmount: bonusAmount,
          commissionRate: 100
        },
        breakdown: {
          baseAmount: bonusAmount,
          commissionRate: 100,
          calculatedAmount: bonusAmount,
          bonusAmount: 0,
          totalAmount: bonusAmount
        },
        percentage: 100
      });

      return commission;
    } catch (error) {
      console.error('Error processing performance bonus:', error);
      throw error;
    }
  }

  /**
   * Get detailed commission history for a user
   */
  static async getCommissionHistory(userId, limit = 50, page = 1) {
    try {
      const skip = (page - 1) * limit;
      
      const commissions = await Commission.find({ toUserId: userId })
        .populate('fromUserId', 'username firstName lastName')
        .populate('sourceDetails.productId', 'name')
        .populate('sourceDetails.orderId', 'orderNumber')
        .populate('sourceDetails.referralUserId', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Commission.countDocuments({ toUserId: userId });

      return {
        commissions,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      };
    } catch (error) {
      console.error('Error getting commission history:', error);
      throw error;
    }
  }

  /**
   * Get commission summary with breakdown by type
   */
  static async getCommissionSummary(userId) {
    try {
      const summary = await Commission.aggregate([
        { $match: { toUserId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);

      const totalEarnings = await Commission.aggregate([
        { $match: { toUserId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        summary,
        totalEarnings: totalEarnings[0] || { total: 0, count: 0 }
      };
    } catch (error) {
      console.error('Error getting commission summary:', error);
      throw error;
    }
  }
}

module.exports = CommissionService;
