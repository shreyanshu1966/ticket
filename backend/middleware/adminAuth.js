import crypto from 'crypto'

// Simple admin authentication middleware
// In production, use proper JWT tokens and secure authentication
export const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    })
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Invalid token format.'
    })
  }

  // Simple token validation (in production, use proper JWT validation)
  const adminToken = process.env.ADMIN_TOKEN
  
  if (!adminToken) {
    return res.status(500).json({
      success: false,
      message: 'Admin token not configured. Please set ADMIN_TOKEN in environment variables.'
    })
  }
  
  if (token !== adminToken) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Invalid admin token.'
    })
  }

  req.isAdmin = true
  next()
}

// Login function to generate admin token
export const adminLogin = (req, res) => {
  const { username, password } = req.body
  
  // Simple credentials check (in production, use proper hashing and database)
  const adminUsername = process.env.ADMIN_USERNAME
  const adminPassword = process.env.ADMIN_PASSWORD
  
  if (!adminUsername || !adminPassword) {
    return res.status(500).json({
      success: false,
      message: 'Admin credentials not configured. Please set ADMIN_USERNAME and ADMIN_PASSWORD in environment variables.'
    })
  }
  
  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    })
  }
  
  // Generate token (in production, use proper JWT)
  const token = process.env.ADMIN_TOKEN
  
  if (!token) {
    return res.status(500).json({
      success: false,
      message: 'Admin token not configured. Please set ADMIN_TOKEN in environment variables.'
    })
  }
  
  res.json({
    success: true,
    message: 'Login successful',
    token,
    expiresIn: '24h'
  })
}