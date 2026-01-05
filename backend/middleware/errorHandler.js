// Enhanced error handling middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message
  
  // Log error details
  console.error('❌ Error occurred:')
  console.error('Path:', req.path)
  console.error('Method:', req.method)
  console.error('IP:', req.ip)
  console.error('User Agent:', req.get('User-Agent'))
  console.error('Error:', err.stack)
  
  // Default error response
  let errorResponse = {
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  }
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    const errors = Object.values(err.errors).map(error => ({
      path: error.path,
      msg: error.message
    }))
    errorResponse = {
      success: false,
      message: 'Validation failed',
      errors: errors
    }
    res.status(400).json(errorResponse)
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyValue)[0]
    errorResponse = {
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
    }
    res.status(400).json(errorResponse)
  } else if (err.name === 'CastError') {
    // MongoDB cast error
    errorResponse = {
      success: false,
      message: 'Resource not found'
    }
    res.status(404).json(errorResponse)
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    errorResponse = {
      success: false,
      message: 'Invalid token'
    }
    res.status(401).json(errorResponse)
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired error
    errorResponse = {
      success: false,
      message: 'Token expired'
    }
    res.status(401).json(errorResponse)
  } else if (err.statusCode) {
    // Custom error with status code
    errorResponse.message = err.message
    res.status(err.statusCode).json(errorResponse)
  } else {
    // Generic server error
    res.status(500).json(errorResponse)
  }
}

// Enhanced 404 handler
export const notFoundHandler = (req, res) => {
  console.warn(`404 - Route not found: ${req.method} ${req.originalUrl} - IP: ${req.ip}`)
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  })
}

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    
    Error.captureStackTrace(this, this.constructor)
  }
}