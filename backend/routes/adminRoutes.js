import express from 'express'
import { body } from 'express-validator'
import { adminAuth, adminLogin, scannerAuth } from '../middleware/adminAuth.js'
import {
  getDashboardStats,
  getAllRegistrations,
  getRegistrationById,
  updateRegistrationStatus,
  deleteRegistration,
  exportRegistrations,
  sendBulkNotification,
  sendTimingCorrection,
  resendTickets,
  getFriendOfferSettings,
  toggleFriendOffer,
  getFriendRegistrations
} from '../controllers/adminController.js'

const router = express.Router()

// Admin login route (public)
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], adminLogin)

// Scanner authentication route (public)
router.post('/scanner/auth', [
  body('password').notEmpty().withMessage('Password is required')
], scannerAuth)

// All routes below this middleware require admin authentication
router.use(adminAuth)

// Dashboard statistics
router.get('/dashboard/stats', getDashboardStats)

// Registration management
router.get('/registrations/:id', getRegistrationById) // Get single registration with full details
router.get('/registrations', getAllRegistrations)
router.patch('/registrations/:id/status', [
  body('paymentStatus')
    .isIn(['pending', 'completed', 'failed'])
    .withMessage('Payment status must be pending, completed, or failed')
], updateRegistrationStatus)
router.delete('/registrations/:id', deleteRegistration)

// Data export
router.get('/export/registrations', exportRegistrations)

// Bulk notifications
router.post('/notifications/bulk', [
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('targetGroup')
    .isIn(['all', 'completed', 'pending', 'failed'])
    .withMessage('Target group must be all, completed, pending, or failed')
], sendBulkNotification)

// Timing correction emails
router.post('/notifications/timing-correction', sendTimingCorrection)

// Resend tickets
router.post('/notifications/resend-tickets', resendTickets)

// Friend offer management
router.get('/friend-offer', getFriendOfferSettings)
router.put('/friend-offer/toggle', [
  body('enabled').isBoolean().withMessage('enabled must be boolean'),
  body('adminName').optional().isString()
], toggleFriendOffer)
router.get('/friend-registrations', getFriendRegistrations)

export default router