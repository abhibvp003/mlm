const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getNetworkStats,
  addNetworkMember,
  getNetworkTree,
  getReferralLink,
  getNetworkAnalytics
} = require('../controllers/networkController');

// All routes require authentication
router.use(auth);

// Get user's network statistics
router.get('/stats', getNetworkStats);

// Add a new member to the network
router.post('/add-member', addNetworkMember);

// Get network tree
router.get('/tree', getNetworkTree);

// Get referral link
router.get('/referral-link', getReferralLink);

// Get network analytics
router.get('/analytics', getNetworkAnalytics);

module.exports = router;
