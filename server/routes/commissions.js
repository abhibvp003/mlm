const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getCommissionHistory,
  getCommissionSummary,
  getCommissionDetails,
  getEarningsBreakdown,
  getRecentCommissions
} = require('../controllers/commissionController');

// All routes require authentication
router.use(auth);

// Get commission history with pagination
router.get('/history', getCommissionHistory);

// Get commission summary with breakdown by type
router.get('/summary', getCommissionSummary);

// Get detailed commission information
router.get('/details/:commissionId', getCommissionDetails);

// Get earnings breakdown by source and monthly
router.get('/breakdown', getEarningsBreakdown);

// Get recent commissions
router.get('/recent', getRecentCommissions);

module.exports = router;
