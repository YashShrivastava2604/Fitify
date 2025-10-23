const { errorResponse } = require('../utils/responses');

/**
 * Global error handling middleware
 * Catches all errors and sends formatted response
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return errorResponse(
      res,
      409,
      `${field} already exists`,
      { field, value: err.keyValue[field] }
    );
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, 400, `Invalid ${err.path}: ${err.value}`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token expired');
  }

  // Default server error
  return errorResponse(
    res,
    err.statusCode || 500,
    err.message || 'Internal server error',
    process.env.NODE_ENV === 'development' ? err.stack : null
  );
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, `Route ${req.originalUrl} not found`);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
