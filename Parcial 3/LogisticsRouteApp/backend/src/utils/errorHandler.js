/**
 * Handle errors consistently across the application
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {Number} statusCode - HTTP status code (optional)
 */
exports.handleError = (res, error, statusCode = 500) => {
  console.error(error);
  
  // Handle Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  // Handle other specific error types here
  
  // Default error response
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error'
  });
};
