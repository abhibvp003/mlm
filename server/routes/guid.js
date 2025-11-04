const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  generateAndSendGUID,
  sendGUIDEmail,
  getUserGUID,
  testEmail,
  generateBulkGUID
} = require('../controllers/guidController');

// All routes require authentication
router.use(auth);

// Test email configuration (admin only)
router.get('/test-email', adminAuth, testEmail);

// Get user's GUID information
router.get('/user/:userId', getUserGUID);

// Generate and send new GUID email to a user
router.post('/generate', generateAndSendGUID);

// Send GUID email to existing user (without generating new GUID)
router.post('/send', sendGUIDEmail);

// Generate GUID for multiple users (admin only)
router.post('/bulk-generate', adminAuth, generateBulkGUID);

module.exports = router;
