import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

// Load environment variables if not already loaded
if (!process.env.EMAIL_HOST) {
  dotenv.config()
}

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'mail.acesmitadt.com',
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  debug: process.env.DEBUG_EMAIL === 'true',
  logger: process.env.DEBUG_EMAIL === 'true'
})

// Verify email configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error.message)
  } else {
    console.log('✅ Email server is ready to send messages')
  }
})

export default transporter