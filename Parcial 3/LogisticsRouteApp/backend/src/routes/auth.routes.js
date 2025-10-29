const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRegister, validateOTPRequest, validateOTPVerify } = require('../middleware/validation.middleware');

// Auth routes
router.post('/request-otp', validateOTPRequest, authController.requestOTP);
router.post('/register', validateRegister, authController.register);
router.post('/verify-otp', validateOTPVerify, authController.verifyOTP);

module.exports = router;
