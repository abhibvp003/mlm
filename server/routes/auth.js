const express = require('express');
const router = express.Router();
const { register, submitMember, login, getProfile, updateProfile, validateReferral } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.get('/validate-referral/:referralCode', validateReferral);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/submit-member', auth, validateUserRegistration, submitMember);

module.exports = router;
