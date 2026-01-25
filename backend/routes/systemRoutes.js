import express from 'express'
import { healthCheck, testEmail, emailQueueStatus, clearQueue } from '../controllers/systemController.js'
import { validateTestEmail } from '../middleware/validation.js'

const router = express.Router()

// Health check
router.get('/health', healthCheck)

// Test email endpoint
router.post('/test-email', validateTestEmail, testEmail)

// Email queue monitoring
router.get('/email-queue', emailQueueStatus)

// Clear email queue (admin only - consider adding auth middleware)
router.post('/clear-email-queue', clearQueue)

export default router