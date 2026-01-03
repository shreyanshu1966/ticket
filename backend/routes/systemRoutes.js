import express from 'express'
import { healthCheck, testEmail } from '../controllers/systemController.js'
import { validateTestEmail } from '../middleware/validation.js'

const router = express.Router()

// Health check
router.get('/health', healthCheck)

// Test email endpoint
router.post('/test-email', validateTestEmail, testEmail)

export default router