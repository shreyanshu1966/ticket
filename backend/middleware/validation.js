import { body } from 'express-validator'

// Validation middleware for registration
export const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name should only contain letters and spaces'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('phone')
    .matches(/^[+]?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('college')
    .trim()
    .isLength({ min: 2 })
    .withMessage('College name must be at least 2 characters long'),
  body('year')
    .isIn(['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'Post Graduate'])
    .withMessage('Please select a valid year')
]

// Validation middleware for test email
export const validateTestEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address')
]