const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getGenealogyTree,
  getTeamStats,
  getCommissionHistory,
  getDownlineMembers,
  getUplinePath,
  getEarningsSummary
} = require('../controllers/mlmController');

// All MLM routes require authentication
router.use(auth);

// Genealogy and team routes
router.get('/genealogy/:userId', getGenealogyTree);
router.get('/team-stats/:userId', getTeamStats);
router.get('/downline/:userId', getDownlineMembers);
router.get('/upline/:userId', getUplinePath);

// Commission and earnings routes
router.get('/commissions/:userId', getCommissionHistory);
router.get('/earnings/:userId', getEarningsSummary);

module.exports = router;
