import express from 'express'
import { 
  verifyExistingUser, 
  verifyOTP, 
  registerFriend, 
  checkEligibility,
  getFriendOfferStatus 
} from '../controllers/friendController.js'
import { body } from 'express-validator'

const router = express.Router()

// Check if friend offer is enabled
router.get('/status', getFriendOfferStatus)

// Check if user is eligible to refer a friend
router.post('/check-eligibility', [
  body('identifier').notEmpty().withMessage('Email or ticket number is required')
], checkEligibility)

// Verify existing user and send OTP
router.post('/verify-existing-user', [
  body('identifier').notEmpty().withMessage('Email or ticket number is required')
], verifyExistingUser)

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], verifyOTP)

// Register friend with discount
router.post('/register', [
  body('referrerEmail').isEmail().withMessage('Valid referrer email is required'),
  body('friend.name').notEmpty().withMessage('Friend name is required'),
  body('friend.email').isEmail().withMessage('Valid friend email is required'),
  body('friend.phone').notEmpty().withMessage('Phone number is required'),
  body('friend.college').notEmpty().withMessage('College is required'),
  body('friend.year').notEmpty().withMessage('Year is required')
], registerFriend)

export default router