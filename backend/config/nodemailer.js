import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

// Load environment variables if not already loaded
if (!process.env.EMAIL_HOST) {
  dotenv.config()
}

// Configure nodemailer with maximum compatibility
const host = process.env.EMAIL_HOST || 'mail.acesmitadt.com'
const port = parseInt(process.env.EMAIL_PORT) || 587  // Use 587 for STARTTLS (more compatible)
const secure = port === 465  // Only use SSL for port 465

console.log(`📧 Configuring email: ${host}:${port} (secure: ${secure})`)

const transporter = nodemailer.createTransport({
  host: host,
  port: port,
  secure: secure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'ALL'  // Allow all ciphers for maximum compatibility
  },
  // Connection settings - Reduced for GoDaddy/cPanel limits
  pool: true,
  maxConnections: 1,  // Only 1 connection at a time to avoid rate limiting
  maxMessages: 10,    // Reduced from 100
  rateDelta: 2000,    // 2 seconds between emails (increased from 1000)
  rateLimit: 1,       // 1 email per rateDelta period
  // Timeouts
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
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