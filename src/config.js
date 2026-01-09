// API Configuration
export const config = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
}

// Payment Configuration
export const PAYMENT_CONFIG = {
  UPI_ID: 'iganarase@okicici', // UPI ID matching the QR code
  AMOUNT: 199, // Amount in rupees
  EVENT_NAME: 'Event Registration'
}

// API endpoints
export const API_ENDPOINTS = {
  REGISTER: '/api/registrations',
  REGISTRATIONS: '/api/registrations',
  HEALTH: '/api/health',
  // Admin endpoints
  ADMIN_LOGIN: '/api/admin/login',
  ADMIN_DASHBOARD_STATS: '/api/admin/dashboard/stats',
  ADMIN_REGISTRATIONS: '/api/admin/registrations',
  ADMIN_EXPORT: '/api/admin/export/registrations',
  ADMIN_NOTIFICATIONS: '/api/admin/notifications/bulk'
}

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${config.API_BASE_URL}${endpoint}`
}

export default config