import { body } from 'express-validator'

// Validation middleware for registration
export const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long')
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage('Name contains invalid characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((value) => {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, '')
      // Check if exactly 10 digits
      if (digitsOnly.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number')
      }
      return true
    }),
  body('college')
    .trim()
    .isLength({ min: 3 })
    .withMessage('College name must be at least 3 characters long'),
  body('year')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required')
    .isIn(['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate', 'PhD', 'Alumni', 'Faculty', 'Other'])
    .withMessage('Please select a valid year')
]

// Validation middleware for test email
export const validateTestEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address')
]