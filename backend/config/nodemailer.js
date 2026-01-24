import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

// Load environment variables if not already loaded
if (!process.env.EMAIL_HOST) {
  dotenv.config()
}

// Configure main transporter for ticketing and registration emails
const host = process.env.EMAIL_HOST || 'mail.acesmitadt.com'
const port = parseInt(process.env.EMAIL_PORT) || 587  // Use 587 for STARTTLS (more compatible)
const secure = port === 465  // Only use SSL for port 465

console.log(`📧 Configuring main email: ${host}:${port} (secure: ${secure})`)

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

// Configure noreply transporter for notifications
const noreplyHost = process.env.NOREPLY_EMAIL_HOST || 'mail.acesmitadt.com'
const noreplyPort = parseInt(process.env.NOREPLY_EMAIL_PORT) || 587  // Port 587 with STARTTLS
const noreplySecure = noreplyPort === 465  // Only use SSL for port 465

console.log(`📧 Configuring noreply email: ${noreplyHost}:${noreplyPort} (secure: ${noreplySecure})`)

export const noreplyTransporter = nodemailer.createTransport({
  host: noreplyHost,
  port: noreplyPort,
  secure: noreplySecure,
  auth: {
    user: process.env.NOREPLY_EMAIL_USER || 'noreply@acesmitadt.com',
    pass: process.env.NOREPLY_EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'ALL'
  },
  // Connection settings
  pool: true,
  maxConnections: 1,
  maxMessages: 10,
  rateDelta: 2000,
  rateLimit: 1,
  // Timeouts
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
  debug: process.env.DEBUG_EMAIL === 'true',
  logger: process.env.DEBUG_EMAIL === 'true'
})

// Configure OTP transporter for no.reply@acesmitadt.com (for OTPs only)
const otpHost = process.env.OTP_EMAIL_HOST || 'mail.acesmitadt.com'
const otpPort = parseInt(process.env.OTP_EMAIL_PORT) || 465  // Port 465 with SSL
const otpSecure = otpPort === 465  // SSL for port 465

console.log(`📧 Configuring OTP email: ${otpHost}:${otpPort} (secure: ${otpSecure})`)

export const otpTransporter = nodemailer.createTransport({
  host: otpHost,
  port: otpPort,
  secure: otpSecure,
  auth: {
    user: process.env.OTP_EMAIL_USER || 'no.reply@acesmitadt.com',
    pass: process.env.OTP_EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'ALL'
  },
  // Connection settings
  pool: true,
  maxConnections: 1,
  maxMessages: 10,
  rateDelta: 2000,
  rateLimit: 1,
  // Timeouts
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
  debug: process.env.DEBUG_EMAIL === 'true',
  logger: process.env.DEBUG_EMAIL === 'true'
})

// Verify main email configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Main email configuration error:', error.message)
  } else {
    console.log('✅ Main email server is ready to send messages')
  }
})

// Verify noreply email configuration
noreplyTransporter.verify((error, success) => {
  if (error) {
    console.log('❌ Noreply email configuration error:', error.message)
  } else {
    console.log('✅ Noreply email server is ready to send messages')
  }
})

// Verify OTP email configuration
otpTransporter.verify((error, success) => {
  if (error) {
    console.log('❌ OTP email configuration error:', error.message)
  } else {
    console.log('✅ OTP email server is ready to send messages')
  }
})

export default transporter