const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  submitInvestment,
  getUserInvestments,
  getPendingInvestments,
  getAllInvestments,
  approveInvestment,
  rejectInvestment,
  getInvestmentStats
} = require('../controllers/investmentController');

// All routes require authentication
router.use(auth);

// Get investment statistics (admin only)
router.get('/stats', async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
}, getInvestmentStats);

// Get all pending investments (admin only)
router.get('/pending', async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
}, getPendingInvestments);

// Get all investments with pagination and filtering (admin only)
router.get('/all', async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
}, getAllInvestments);

// Get user's investments
router.get('/my', getUserInvestments);

// Submit investment request
router.post('/submit', submitInvestment);

// Approve investment (admin only)
router.post('/:investmentId/approve', async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
}, approveInvestment);

// Reject investment (admin only)
router.post('/:investmentId/reject', async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
}, rejectInvestment);

module.exports = router;
