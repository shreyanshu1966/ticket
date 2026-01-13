import Registration from '../models/Registration.js'
import { verifyQRCode } from '../services/ticketService.js'

// Verify ticket by QR code data
export const verifyTicket = async (req, res) => {
  try {
    const { qrData } = req.body

    // Enhanced logging for debugging
    console.log('📥 Verify ticket request received')
    console.log('Request body:', JSON.stringify(req.body, null, 2))
    console.log('QR Data:', qrData)

    if (!qrData) {
      console.log('❌ No qrData provided')
      return res.status(400).json({
        success: false,
        message: 'QR code data is required'
      })
    }

    // Verify QR code format
    const qrVerification = verifyQRCode(qrData)
    console.log('QR Verification result:', qrVerification)

    if (!qrVerification.valid) {
      console.log('❌ QR verification failed:', qrVerification.error)
      return res.status(400).json({
        success: false,
        message: qrVerification.error
      })
    }


    const { ticketNumber, registrationId } = qrVerification.data

    console.log('🔍 Looking up registration in database...')
    console.log('Query:', { _id: registrationId, ticketNumber, paymentStatus: 'completed' })

    // Find registration by ticket number and ID
    const registration = await Registration.findOne({
      _id: registrationId,
      ticketNumber: ticketNumber,
      paymentStatus: 'completed'
    })

    console.log('Database result:', registration ? '✅ Found' : '❌ Not found')
    if (registration) {
      console.log('Registration details:', {
        id: registration._id,
        ticketNumber: registration.ticketNumber,
        name: registration.name,
        paymentStatus: registration.paymentStatus
      })
    }

    if (!registration) {
      console.log('❌ Registration not found - possible reasons:')
      console.log('  1. Ticket number mismatch')
      console.log('  2. Registration ID not in database')
      console.log('  3. Payment status not completed')
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket or registration not found'
      })
    }


    // Check if already scanned
    console.log('🔍 Checking scan status...')
    console.log('isScanned:', registration.isScanned)
    console.log('scannedAt:', registration.scannedAt)
    console.log('entryConfirmed:', registration.entryConfirmed)

    if (registration.isScanned) {
      const scannedDate = new Date(registration.scannedAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium'
      })

      console.log('⚠️ DUPLICATE ENTRY ATTEMPT DETECTED!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 Ticket Details:')
      console.log(`   Ticket Number: ${registration.ticketNumber}`)
      console.log(`   Name: ${registration.name}`)
      console.log(`   Email: ${registration.email}`)
      console.log(`   College: ${registration.college}`)
      console.log('⏰ Previous Entry:')
      console.log(`   Scanned At: ${scannedDate}`)
      console.log(`   Entry Confirmed: ${registration.entryConfirmed ? 'Yes' : 'No'}`)
      console.log('🚫 Action: Entry DENIED - Ticket already used')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      return res.status(400).json({
        success: false,
        message: 'Ticket already scanned',
        error: 'DUPLICATE_ENTRY',
        data: {
          name: registration.name,
          email: registration.email,
          ticketNumber: registration.ticketNumber,
          scannedAt: registration.scannedAt,
          scannedAtFormatted: scannedDate,
          entryConfirmed: registration.entryConfirmed,
          warningMessage: `This ticket was already used for entry on ${scannedDate}`
        }
      })
    }


    console.log('✅ Ticket is valid and not yet scanned')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ TICKET VERIFIED SUCCESSFULLY')
    console.log('📋 Attendee Details:')
    console.log(`   Ticket Number: ${registration.ticketNumber}`)
    console.log(`   Name: ${registration.name}`)
    console.log(`   Email: ${registration.email}`)
    console.log(`   College: ${registration.college}`)
    console.log(`   Year: ${registration.year}`)
    console.log('✅ Ready for entry confirmation')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    res.json({
      success: true,
      message: 'Ticket verified successfully',
      data: {
        ticketNumber: registration.ticketNumber,
        name: registration.name,
        email: registration.email,
        college: registration.college,
        year: registration.year,
        amount: registration.amount,
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

    console.log('🎫 Entry confirmation request received')
    console.log('Registration ID:', registrationId)
    console.log('Ticket Number:', ticketNumber)

    if (!registrationId || !ticketNumber) {
      console.log('❌ Missing required fields')
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
      console.log('❌ Registration not found for entry confirmation')
      return res.status(404).json({
        success: false,
        message: 'Registration not found or invalid ticket'
      })
    }

    const entryTime = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium'
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 ENTRY CONFIRMED SUCCESSFULLY')
    console.log('📋 Attendee Information:')
    console.log(`   Ticket Number: ${registration.ticketNumber}`)
    console.log(`   Name: ${registration.name}`)
    console.log(`   Email: ${registration.email}`)
    console.log(`   College: ${registration.college}`)
    console.log(`   Year: ${registration.year}`)
    console.log('⏰ Entry Details:')
    console.log(`   Confirmed At: ${entryTime}`)
    console.log(`   Entry Status: GRANTED`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

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