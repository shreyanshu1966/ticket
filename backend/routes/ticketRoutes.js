import express from 'express'
import {
  verifyTicket,
  confirmEntry,
  verifyTicketMultiDay,
  confirmEntryMultiDay,
  getMultiDayStats,
  getAttendanceStats,
  getScannedTickets
} from '../controllers/ticketController.js'

const router = express.Router()

// Original single-day endpoints
// Verify a ticket using QR code
router.post('/verify', verifyTicket)

// Confirm entry for verified ticket
router.post('/confirm-entry', confirmEntry)

// New multi-day endpoints
// Verify a ticket for specific event day
router.post('/verify-multi-day', verifyTicketMultiDay)

// Confirm entry for specific event day
router.post('/confirm-entry-multi-day', confirmEntryMultiDay)

// Get multi-day statistics
router.get('/multi-day-stats', getMultiDayStats)

// Get attendance statistics (legacy)
router.get('/attendance-stats', getAttendanceStats)

// Get scanned tickets
router.get('/scanned-tickets', getScannedTickets)

export default router