const express = require('express');
const router = express.Router();
const {
  getPendingUsers,
  getAllPendingUsers,
  approveUser,
  rejectUser,
  getPendingUserDetails,
  getApprovalStats
} = require('../controllers/approvalController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get approval statistics (admin only)
router.get('/stats', async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
}, getApprovalStats);

// Get all pending users (admin only)
router.get('/pending', async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
}, getPendingUsers);

// Get all users with pagination and filtering (admin only)
router.get('/all', async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
}, getAllPendingUsers);

// Get pending user details (admin only)
router.get('/:pendingUserId', async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
}, getPendingUserDetails);

// Approve a pending user (admin only)
router.post('/:pendingUserId/approve', async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
}, approveUser);

// Reject a pending user (admin only)
router.post('/:pendingUserId/reject', async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
}, rejectUser);

module.exports = router;
