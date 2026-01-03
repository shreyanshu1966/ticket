import express from 'express'
import registrationRoutes from './registrationRoutes.js'
import systemRoutes from './systemRoutes.js'
import ticketRoutes from './ticketRoutes.js'

const router = express.Router()

// System routes (health, test-email)
router.use('/api', systemRoutes)

// Registration routes
router.use('/api/registrations', registrationRoutes)

// Ticket routes
router.use('/api/tickets', ticketRoutes)

// Legacy endpoints for backward compatibility
router.use('/api', registrationRoutes)

export default router