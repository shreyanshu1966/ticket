// API Configuration
export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RsMk6Cq17QXPbk',
}

// API endpoints
export const API_ENDPOINTS = {
  CREATE_ORDER: '/api/create-order',
  VERIFY_PAYMENT: '/api/verify-payment',
  REGISTRATIONS: '/api/registrations',
  HEALTH: '/api/health'
}

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${config.API_BASE_URL}${endpoint}`
}

export default config