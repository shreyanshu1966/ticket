import { sendTestEmail } from '../services/emailService.js'
import { validationResult } from 'express-validator'

// Health check
export const healthCheck = (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Event Registration Backend is running',
    timestamp: new Date().toISOString(),
    emailConfigured: !!process.env.EMAIL_USER
  })
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