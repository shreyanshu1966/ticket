import express from 'express'
import registrationRoutes from './registrationRoutes.js'
import systemRoutes from './systemRoutes.js'
import ticketRoutes from './ticketRoutes.js'
import adminRoutes from './adminRoutes.js'

const router = express.Router()

// System routes (health, test-email)
router.use('/api', systemRoutes)

// Registration routes
router.use('/api/registrations', registrationRoutes)

// Ticket routes
router.use('/api/tickets', ticketRoutes)

// Admin routes
router.use('/api/admin', adminRoutes)

// Legacy endpoints for backward compatibility (only specific endpoints to avoid duplication)
router.post('/api/create-order', (req, res, next) => {
  req.url = '/create-order'
  registrationRoutes(req, res, next)
})

router.post('/api/verify-payment', (req, res, next) => {
  req.url = '/verify-payment'
  registrationRoutes(req, res, next)
})

router.post('/api/check-verification', (req, res, next) => {
  req.url = '/check-verification'
  registrationRoutes(req, res, next)
})

export default router