import { sendTestEmail } from '../services/emailService.js'
import { getEmailQueueStatus, clearEmailQueue } from '../services/queuedEmailService.js'
import { validationResult } from 'express-validator'

// Health check with enhanced connectivity tests
export const healthCheck = async (req, res) => {
  const healthStatus = {
    status: 'OK',
    message: 'Event Registration Backend is running',
    timestamp: new Date().toISOString(),
    services: {
      database: 'OK',
      email: !!process.env.EMAIL_USER
    }
  }

  try {
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
        message: result.error // This now contains user-friendly message from service
      })
    }
  } catch (error) {
    console.error('Test email failed:', error)
    res.status(500).json({
      success: false,
      message: 'Unable to send test email at this time'
    })
  }
}

// Email queue status endpoint
export const emailQueueStatus = async (req, res) => {
  try {
    const queueStatus = getEmailQueueStatus()
    res.json({
      success: true,
      queue: queueStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Email queue status error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get email queue status',
      error: error.message
    })
  }
}

// Clear email queue endpoint (admin only)
export const clearQueue = async (req, res) => {
  try {
    const clearedCount = clearEmailQueue()
    res.json({
      success: true,
      message: `Cleared ${clearedCount} emails from queue`,
      clearedCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Clear email queue error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to clear email queue',
      error: error.message
    })
  }
}