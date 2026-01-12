import express from 'express'
import {
  getAllRegistrations,
  getRegistrationById,
  registerDirect,
  createRegistration,
  submitPayment,
  verifyPayment,
  updatePaymentStatus,
  checkEmailStatus
} from '../controllers/registrationController.js'
import { validateRegistration } from '../middleware/validation.js'

const router = express.Router()

// Check email status (for Option 3 - smart form detection)
router.get('/check-email', checkEmailStatus)

// Get all registrations (with optional pagination)
router.get('/', getAllRegistrations)

// Get registration by ID
router.get('/:id', getRegistrationById)

// Direct registration endpoint (legacy)
router.post('/register', validateRegistration, registerDirect)
router.post('/', validateRegistration, registerDirect)

// New UPI payment flow
router.post('/create', validateRegistration, createRegistration)
router.post('/submit-payment', submitPayment)
router.patch('/:id/verify', verifyPayment)

// Update payment status (admin only)
router.patch('/:id/payment-status', updatePaymentStatus)

export default router