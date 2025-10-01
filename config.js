3// config.js - Configuration settings for the ticket sender
require('dotenv').config();

module.exports = {
  // Email Configuration
  email: {
    user: process.env.EMAIL_USER || 'official@acesmitadt.com',
    password: process.env.EMAIL_PASS,
    host: process.env.EMAIL_HOST || 'acesmitadt.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE === 'true' || true
  },

  // MongoDB Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/shakti_tickets',
    options: {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      bufferCommands: false, // Disable mongoose buffering
    }
  },

  // Event Details
  event: {
    name: process.env.EVENT_NAME || 'SHAKTI',
    date: process.env.EVENT_DATE || '2025-10-15',
    time: process.env.EVENT_TIME || '10:00 AM',
    venue: process.env.EVENT_VENUE || 'MIT Academy of Engineering, Alandi',
    organizer: process.env.ORGANIZER || 'ACES MIT ADT'
  },

  // Sender Information
  sender: {
    name: process.env.FROM_NAME || 'ACES MIT ADT',
    email: process.env.FROM_EMAIL || 'official@acesmitadt.com'
  },

  // QR Code Settings
  qr: {
    size: parseInt(process.env.QR_CODE_SIZE) || 200,
    ticketPrefix: process.env.TICKET_ID_PREFIX || 'SHAKTI2025'
  },

  // CSV File Path
  csvFile: './SHAKTI ATTENDEES - Form responses 1.csv'
};