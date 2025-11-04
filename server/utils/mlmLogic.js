const User = require('../models/User');
const Commission = require('../models/Commission');

class MLMLogic {
  // Calculate binary commission
  static async calculateBinaryCommission(userId, amount, pv) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.sponsorId) return;

      const sponsor = await User.findById(user.sponsorId);
      if (!sponsor) return;

      // Binary commission rate (example: 10%)
      const binaryRate = 0.10;
      const commissionAmount = amount * binaryRate;

      // Create commission record
      const commission = new Commission({
        userId: sponsor._id,
        fromUserId: userId,
        amount: commissionAmount,
        percentage: binaryRate * 100,
        level: 1,
        type: 'binary',
        description: `Binary commission from ${user.username}`
      });

      await commission.save();

      // Update sponsor's total earnings
      sponsor.totalEarnings += commissionAmount;
      sponsor.totalCommissions += commissionAmount;
      await sponsor.save();

      // Recursively calculate for upline
      await this.calculateBinaryCommission(sponsor._id, amount, pv);
    } catch (error) {
      console.error('Error calculating binary commission:', error);
    }
  }

  // Calculate direct commission
  static async calculateDirectCommission(userId, amount, pv) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.sponsorId) return;

      const sponsor = await User.findById(user.sponsorId);
      if (!sponsor) return;

      // Direct commission rate (example: 20%)
      const directRate = 0.20;
      const commissionAmount = amount * directRate;

      // Create commission record
      const commission = new Commission({
        userId: sponsor._id,
        fromUserId: userId,
        amount: commissionAmount,
        percentage: directRate * 100,
        level: 1,
        type: 'direct',
        description: `Direct commission from ${user.username}`
      });

      await commission.save();

      // Update sponsor's total earnings
      sponsor.totalEarnings += commissionAmount;
      sponsor.totalCommissions += commissionAmount;
      await sponsor.save();
    } catch (error) {
      console.error('Error calculating direct commission:', error);
    }
  }

  // Get genealogy tree
  static async getGenealogyTree(userId, maxLevel = 5) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const buildTree = async (currentUser, level = 0) => {
        if (level >= maxLevel) return null;

        const children = await User.find({ 
          sponsorId: currentUser._id 
        }).select('username firstName lastName level totalEarnings isActive position');

        const tree = {
          id: currentUser._id,
          username: currentUser.username,
          fullName: currentUser.fullName,
          level: currentUser.level,
          totalEarnings: currentUser.totalEarnings,
          isActive: currentUser.isActive,
          position: currentUser.position,
          children: []
        };

        for (const child of children) {
          const childTree = await buildTree(child, level + 1);
          if (childTree) {
            tree.children.push(childTree);
          }
        }

        return tree;
      };

      return await buildTree(user);
    } catch (error) {
      console.error('Error building genealogy tree:', error);
      return null;
    }
  }

  // Get team statistics
  static async getTeamStats(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const getTeamMembers = async (currentUserId, level = 0) => {
        const directMembers = await User.find({ sponsorId: currentUserId });
        let totalMembers = directMembers.length;
        let totalEarnings = 0;

        for (const member of directMembers) {
          const memberStats = await getTeamMembers(member._id, level + 1);
          totalMembers += memberStats.totalMembers;
          totalEarnings += memberStats.totalEarnings;
          totalEarnings += member.totalEarnings;
        }

        return { totalMembers, totalEarnings };
      };

      const stats = await getTeamMembers(userId);
      
      return {
        userId: user._id,
        username: user.username,
        directMembers: await User.countDocuments({ sponsorId: userId }),
        totalTeamMembers: stats.totalMembers,
        totalTeamEarnings: stats.totalEarnings,
        personalEarnings: user.totalEarnings
      };
    } catch (error) {
      console.error('Error getting team stats:', error);
      return null;
    }
  }

  // Process new member registration
  static async processNewMember(newUserId, sponsorId, position = null) {
    try {
      const newUser = await User.findById(newUserId);
      const sponsor = await User.findById(sponsorId);

      if (!newUser || !sponsor) {
        throw new Error('Invalid user or sponsor');
      }

      // Update new user's sponsor and position (position is now optional)
      newUser.sponsorId = sponsorId;
      newUser.position = position;
      newUser.level = sponsor.level + 1;
      await newUser.save();

      // Update sponsor's team count
      await sponsor.updateNetworkStats();
      
      return { success: true, message: 'Member successfully added to genealogy' };
    } catch (error) {
      console.error('Error processing new member:', error);
      throw error;
    }
  }

  // Get commission history
  static async getCommissionHistory(userId, limit = 50, page = 1) {
    try {
      const skip = (page - 1) * limit;
      
      const commissions = await Commission.find({ userId })
        .populate('fromUserId', 'username fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Commission.countDocuments({ userId });

      return {
        commissions,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      console.error('Error getting commission history:', error);
      throw error;
    }
  }
}

module.exports = MLMLogic;
