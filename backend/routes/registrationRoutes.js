import express from 'express'
import {
  getAllRegistrations,
  getRegistrationById,
  createOrder,
  verifyPayment,
  updatePaymentStatus,
  checkVerificationStatus,
  registerDirect
} from '../controllers/registrationController.js'
import { validateRegistration } from '../middleware/validation.js'

const router = express.Router()

// Get all registrations
router.get('/', getAllRegistrations)

// Get registration by ID
router.get('/:id', getRegistrationById)

// Create Razorpay order
router.post('/create-order', validateRegistration, createOrder)

// Verify payment
router.post('/verify-payment', verifyPayment)

// Check verification status and resend email if needed
router.post('/check-verification', checkVerificationStatus)

// Update payment status
router.patch('/:id/payment', updatePaymentStatus)

// Legacy register endpoint (redirect to payment flow)
router.post('/register', validateRegistration, registerDirect)

export default router