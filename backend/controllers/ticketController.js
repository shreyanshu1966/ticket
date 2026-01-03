import Registration from '../models/Registration.js'
import { verifyQRCode } from '../services/ticketService.js'

// Verify ticket by QR code data
export const verifyTicket = async (req, res) => {
  try {
    const { qrData } = req.body
    
    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR code data is required'
      })
    }
    
    // Verify QR code format
    const qrVerification = verifyQRCode(qrData)
    if (!qrVerification.valid) {
      return res.status(400).json({
        success: false,
        message: qrVerification.error
      })
    }
    
    const { ticketNumber, registrationId } = qrVerification.data
    
    // Find registration by ticket number and ID
    const registration = await Registration.findOne({
      _id: registrationId,
      ticketNumber: ticketNumber,
      paymentStatus: 'completed'
    })
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket or registration not found'
      })
    }
    
    // Check if already scanned
    if (registration.isScanned) {
      return res.status(400).json({
        success: false,
        message: 'Ticket already scanned',
        data: {
          name: registration.name,
          scannedAt: registration.scannedAt,
          entryConfirmed: registration.entryConfirmed
        }
      })
    }
    
    res.json({
      success: true,
      message: 'Ticket verified successfully',
      data: {
        ticketNumber: registration.ticketNumber,
        name: registration.name,
        email: registration.email,
        college: registration.college,
        year: registration.year,
        registrationId: registration._id,
        isScanned: registration.isScanned,
        entryConfirmed: registration.entryConfirmed
      }
    })
    
  } catch (error) {
    console.error('Ticket verification error:', error)
    res.status(500).json({
      success: false,
      message: 'Ticket verification failed'
    })
  }
}

// Confirm entry (mark ticket as scanned)
export const confirmEntry = async (req, res) => {
  try {
    const { registrationId, ticketNumber } = req.body
    
    if (!registrationId || !ticketNumber) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID and ticket number are required'
      })
    }
    
    // Find and update registration
    const registration = await Registration.findOneAndUpdate(
      {
        _id: registrationId,
        ticketNumber: ticketNumber,
        paymentStatus: 'completed'
      },
      {
        isScanned: true,
        scannedAt: new Date(),
        entryConfirmed: true
      },
      { new: true }
    )
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or invalid ticket'
      })
    }
    
    res.json({
      success: true,
      message: 'Entry confirmed successfully',
      data: {
        name: registration.name,
        ticketNumber: registration.ticketNumber,
        scannedAt: registration.scannedAt,
        entryConfirmed: registration.entryConfirmed
      }
    })
    
  } catch (error) {
    console.error('Entry confirmation error:', error)
    res.status(500).json({
      success: false,
      message: 'Entry confirmation failed'
    })
  }
}

// Get attendance statistics
export const getAttendanceStats = async (req, res) => {
  try {
    const totalRegistrations = await Registration.countDocuments({ paymentStatus: 'completed' })
    const scannedTickets = await Registration.countDocuments({ 
      paymentStatus: 'completed',
      isScanned: true 
    })
    const confirmedEntries = await Registration.countDocuments({ 
      paymentStatus: 'completed',
      entryConfirmed: true 
    })
    
    res.json({
      success: true,
      data: {
        totalRegistrations,
        scannedTickets,
        confirmedEntries,
        pendingEntries: totalRegistrations - scannedTickets
      }
    })
    
  } catch (error) {
    console.error('Error fetching attendance stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics'
    })
  }
}

// Get all scanned tickets
export const getScannedTickets = async (req, res) => {
  try {
    const scannedTickets = await Registration.find({
      paymentStatus: 'completed',
      isScanned: true
    })
    .select('name email college year ticketNumber scannedAt entryConfirmed')
    .sort({ scannedAt: -1 })
    
    res.json({
      success: true,
      count: scannedTickets.length,
      data: scannedTickets
    })
    
  } catch (error) {
    console.error('Error fetching scanned tickets:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scanned tickets'
    })
  }
}