const { body, param, validationResult } = require('express-validator');

// Validation middleware helper
const validate = validations => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    next();
  };
};

// Validate register request
exports.validateRegister = validate([
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required'),
  body('companyName')
    .notEmpty()
    .withMessage('Company name is required')
]);

// Validate OTP request
exports.validateOTPRequest = validate([
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
]);

// Validate OTP verification
exports.validateOTPVerify = validate([
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
]);

// Validate route optimization request
exports.validateRouteOptimization = validate([
  body('origin')
    .notEmpty()
    .withMessage('Origin is required'),
  body('origin.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required for origin'),
  body('origin.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required for origin'),
  body('destinations')
    .isArray({ min: 1 })
    .withMessage('At least one destination is required')
]);

// Validate create delivery request
exports.validateCreateDelivery = validate([
  body('origin')
    .notEmpty()
    .withMessage('Origin is required'),
  body('origin.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required for origin'),
  body('origin.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required for origin'),
  body('destinations')
    .isArray({ min: 1 })
    .withMessage('At least one destination is required'),
  body('routeInfo')
    .notEmpty()
    .withMessage('Route info is required')
]);

// Validate delivery stop completion
exports.validateDeliveryStop = validate([
  param('id')
    .notEmpty()
    .withMessage('Delivery ID is required'),
  body('destinationId')
    .notEmpty()
    .withMessage('Destination ID is required')
]);
