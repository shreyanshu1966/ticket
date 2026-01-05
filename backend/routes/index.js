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

// Legacy endpoints for backward compatibility
router.use('/api', registrationRoutes)

export default router