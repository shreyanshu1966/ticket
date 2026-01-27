import express from 'express'
import registrationRoutes from './registrationRoutes.js'
import systemRoutes from './systemRoutes.js'
import ticketRoutes from './ticketRoutes.js'
import adminRoutes from './adminRoutes.js'
import friendRoutes from './friendRoutes.js'

const router = express.Router()

// System routes (health, test-email)
router.use('/api', systemRoutes)

// Registration routes - ENABLED
router.use('/api/registrations', registrationRoutes)

router.post('/api/verify-payment', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Registrations are currently closed',
    error: 'REGISTRATIONS_CLOSED',
    timestamp: new Date().toISOString()
  })
})

router.post('/api/check-verification', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Registrations are currently closed',
    error: 'REGISTRATIONS_CLOSED',
    timestamp: new Date().toISOString()
  })
})

// Ticket routes
router.use('/api/tickets', ticketRoutes)

// Admin routes
router.use('/api/admin', adminRoutes)

// Friend referral routes - COMMENTED OUT - REGISTRATIONS CLOSED
// router.use('/api/friend', friendRoutes)

// Return "registrations closed" message for friend referral endpoints
router.use('/api/friend/*', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Registrations are currently closed',
    error: 'REGISTRATIONS_CLOSED',
    timestamp: new Date().toISOString()
  })
})

// Legacy endpoints for backward compatibility - COMMENTED OUT - REGISTRATIONS CLOSED
// router.post('/api/create-order', (req, res, next) => {
//   req.url = '/create-order'
//   registrationRoutes(req, res, next)
// })

// router.post('/api/verify-payment', (req, res, next) => {
//   req.url = '/verify-payment'
//   registrationRoutes(req, res, next)
// })

// router.post('/api/check-verification', (req, res, next) => {
//   req.url = '/check-verification'
//   registrationRoutes(req, res, next)
// })

export default router