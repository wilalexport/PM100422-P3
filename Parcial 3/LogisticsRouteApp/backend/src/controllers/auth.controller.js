const jwt = require('jsonwebtoken');
const { User, OTP } = require('../models');
const { generateOTP, sendOTPEmail } = require('../services/emailService');
const { handleError } = require('../utils/errorHandler');
const config = require('../config/config');
const logger = require('../utils/logger');

// Request OTP for login or registration verification
exports.requestOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Generate a random 4-digit OTP
    const otpCode = generateOTP(config.otp.length);
    
    // Calculate expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + config.otp.expiresIn);
    
    // Save OTP to database
    await OTP.create({
      email,
      otp: otpCode,
      expiresAt,
      isUsed: false
    });
    
    // Send OTP via email
    await sendOTPEmail(email, otpCode);
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, companyName, companyRole } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const user = await User.create({
      fullName,
      email,
      phone,
      companyName,
      companyRole: companyRole || null,
      isVerified: false
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Verify OTP and complete login/registration
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }
    
    // Find the most recent OTP for this email
    const otpRecord = await OTP.findOne({
      where: { email },
      order: [['createdAt', 'DESC']]
    });
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    // Check if OTP is valid and not expired
    if (!otpRecord.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired or already used'
      });
    }
    
    // Verify OTP matches using bcrypt comparison
    const isOTPValid = await otpRecord.verifyOTP(otp);
    
    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    // Mark OTP as used
    await otpRecord.markAsUsed();
    
    // Find or create user
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }
    
    // Update user's verified status and last login
    user.isVerified = true;
    await user.updateLastLogin();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};
