import { sendTestEmail } from '../services/emailService.js'
import { validationResult } from 'express-validator'
import razorpay from '../config/razorpay.js'

// Health check with enhanced connectivity tests
export const healthCheck = async (req, res) => {
  const healthStatus = {
    status: 'OK',
    message: 'Event Registration Backend is running',
    timestamp: new Date().toISOString(),
    services: {
      database: 'OK',
      email: !!process.env.EMAIL_USER,
      razorpay: 'OK'
    }
  }

  try {
    // Test Razorpay connectivity by fetching a dummy order (will fail but shows API connectivity)
    try {
      await razorpay.orders.fetch('dummy_order_id')
    } catch (razorpayError) {
      // Expected error for dummy order, but if we get network error, mark as down
      if (razorpayError.message.includes('ENOTFOUND') || 
          razorpayError.message.includes('ECONNREFUSED') || 
          razorpayError.message.includes('timeout')) {
        healthStatus.services.razorpay = 'DOWN'
        healthStatus.status = 'DEGRADED'
      }
    }

    res.json(healthStatus)
  } catch (error) {
    console.error('Health check error:', error)
    res.status(503).json({
      status: 'ERROR',
      message: 'Service health check failed',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    })
  }
}

// Test email endpoint
export const testEmail = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      })
    }

    const { email } = req.body
    const result = await sendTestEmail(email)
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      })
    }
  } catch (error) {
    console.error('Test email failed:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    })
  }
}