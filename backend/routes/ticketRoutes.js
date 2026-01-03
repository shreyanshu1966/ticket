import express from 'express'
import {
  verifyTicket,
  confirmEntry,
  getAttendanceStats
} from '../controllers/ticketController.js'

const router = express.Router()

// Verify a ticket using QR code
router.post('/verify', verifyTicket)

// Confirm entry for verified ticket
router.post('/confirm-entry', confirmEntry)

// Get attendance statistics
router.get('/attendance-stats', getAttendanceStats)

export default router