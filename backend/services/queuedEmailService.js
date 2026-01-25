import transporter, { noreplyTransporter, otpTransporter } from '../config/nodemailer.js'
import emailQueue from './emailQueue.js'

// Queue-based email sending functions
export const sendEmailQueued = (mailOptions, transporterType = 'main') => {
  return new Promise((resolve, reject) => {
    const sendFunction = async (options) => {
      let selectedTransporter
      
      switch (transporterType) {
        case 'noreply':
          selectedTransporter = noreplyTransporter
          break
        case 'otp':
          selectedTransporter = otpTransporter
          break
        case 'main':
        default:
          selectedTransporter = transporter
          break
      }

      return await selectedTransporter.sendMail(options)
    }

    const taskId = emailQueue.addToQueue({
      mailOptions,
      sendFunction,
      transporterType
    })

    // Listen for this specific email result
    const successHandler = (data) => {
      if (data.taskId === taskId) {
        emailQueue.removeListener('emailSent', successHandler)
        emailQueue.removeListener('emailFailed', failureHandler)
        resolve(data.result)
      }
    }

    const failureHandler = (data) => {
      if (data.taskId === taskId) {
        emailQueue.removeListener('emailSent', successHandler)
        emailQueue.removeListener('emailFailed', failureHandler)
        reject(new Error(data.error))
      }
    }

    emailQueue.on('emailSent', successHandler)
    emailQueue.on('emailFailed', failureHandler)

    // Timeout after 5 minutes
    setTimeout(() => {
      emailQueue.removeListener('emailSent', successHandler)
      emailQueue.removeListener('emailFailed', failureHandler)
      reject(new Error('Email sending timeout after 5 minutes'))
    }, 300000)
  })
}

// Specific helper functions for different email types
export const sendMainEmailQueued = (mailOptions) => {
  return sendEmailQueued(mailOptions, 'main')
}

export const sendNoreplyEmailQueued = (mailOptions) => {
  return sendEmailQueued(mailOptions, 'noreply')
}

export const sendOtpEmailQueued = (mailOptions) => {
  return sendEmailQueued(mailOptions, 'otp')
}

// Get queue status
export const getEmailQueueStatus = () => {
  return emailQueue.getStatus()
}

// Clear queue (emergency function)
export const clearEmailQueue = () => {
  return emailQueue.clearQueue()
}