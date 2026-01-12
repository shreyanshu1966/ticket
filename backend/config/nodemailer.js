import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

// Load environment variables if not already loaded
if (!process.env.EMAIL_HOST) {
  dotenv.config()
}

// Configure nodemailer
const host = process.env.EMAIL_HOST || 'mail.acesmitadt.com'
const port = parseInt(process.env.EMAIL_PORT) || 587 // Changed to 587 for STARTTLS
const secure = port === 465 // Use implicit SSL only for port 465

console.log(`📧 Configuring email: ${host}:${port} (secure: ${secure})`)

const transporter = nodemailer.createTransport({
  host: host,
  port: port,
  secure: secure, // false for port 587, true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false, // Trust self-signed certs
    minVersion: 'TLSv1.2' // Use modern TLS versions
  },
  requireTLS: port === 587, // Require STARTTLS for port 587
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