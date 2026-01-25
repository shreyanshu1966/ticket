import Registration from '../models/Registration.js'
import EventEntry from '../models/EventEntry.js'
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
    console.log('Query:', { _id: registrationId, paymentStatus: 'completed' })

    // Find registration - check both primary ticket and group member tickets
    let registration = await Registration.findOne({
      _id: registrationId,
      ticketNumber: ticketNumber,
      paymentStatus: 'completed'
    })

    let isGroupMember = false
    let memberIndex = -1
    let groupMember = null

    // If not found in primary ticket, check group members
    if (!registration) {
      console.log('🔍 Not found in primary ticket, checking group members...')
      registration = await Registration.findOne({
        _id: registrationId,
        paymentStatus: 'completed',
        'groupMembers.ticketNumber': ticketNumber
      })

      if (registration) {
        isGroupMember = true
        memberIndex = registration.groupMembers.findIndex(member => member.ticketNumber === ticketNumber)
        groupMember = registration.groupMembers[memberIndex]
        console.log('✅ Found in group members, member index:', memberIndex)
      }
    }

    console.log('Database result:', registration ? '✅ Found' : '❌ Not found')
    if (registration) {
      console.log('Registration details:', {
        id: registration._id,
        ticketNumber: isGroupMember ? `Group Member - ${ticketNumber}` : registration.ticketNumber,
        name: isGroupMember ? registration.groupMembers[memberIndex].name : registration.name,
        paymentStatus: registration.paymentStatus,
        isGroupMember: isGroupMember
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


    // Check if already scanned (considering group members)
    console.log('🔍 Checking scan status...')
    let isScanned, scannedAt, entryConfirmed, attendeeName, attendeeDetails

    // Check if this is a group member ticket
    if (groupMember) {
      isScanned = groupMember.isScanned
      scannedAt = groupMember.scannedAt
      entryConfirmed = groupMember.entryConfirmed
      attendeeName = groupMember.name
      attendeeDetails = {
        name: groupMember.name,
        college: groupMember.college,
        year: groupMember.year,
        email: groupMember.email, // Use the group member's own email
        ticketNumber: ticketNumber
      }
    } else {
      // Primary member ticket
      isScanned = registration.isScanned
      scannedAt = registration.scannedAt
      entryConfirmed = registration.entryConfirmed
      attendeeName = registration.name
      attendeeDetails = {
        name: registration.name,
        college: registration.college,
        year: registration.year,
        email: registration.email,
        ticketNumber: registration.ticketNumber
      }
    }

    console.log('isScanned:', isScanned)
    console.log('scannedAt:', scannedAt)
    console.log('entryConfirmed:', entryConfirmed)
    console.log('attendeeName:', attendeeName)

    if (isScanned) {
      const scannedDate = new Date(scannedAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium'
      })

      console.log('⚠️ DUPLICATE ENTRY ATTEMPT DETECTED!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 Ticket Details:')
      console.log(`   Ticket Number: ${ticketNumber}`)
      console.log(`   Name: ${attendeeName}`)
      console.log(`   Email: ${attendeeDetails.email}`)
      console.log(`   College: ${attendeeDetails.college}`)
      console.log('⏰ Previous Entry:')
      console.log(`   Scanned At: ${scannedDate}`)
      console.log(`   Entry Confirmed: ${entryConfirmed ? 'Yes' : 'No'}`)
      console.log('🚫 Action: Entry DENIED - Ticket already used')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      return res.status(400).json({
        success: false,
        message: 'Ticket already scanned',
        error: 'DUPLICATE_ENTRY',
        data: {
          name: attendeeName,
          email: attendeeDetails.email,
          ticketNumber: ticketNumber,
          scannedAt: scannedAt,
          scannedAtFormatted: scannedDate,
          entryConfirmed: entryConfirmed,
          warningMessage: `This ticket was already used for entry on ${scannedDate}`
        }
      })
    }


    console.log('✅ Ticket is valid and not yet scanned')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ TICKET VERIFIED SUCCESSFULLY')
    console.log('📋 Attendee Details:')
    console.log(`   Ticket Number: ${ticketNumber}`)
    console.log(`   Name: ${attendeeDetails.name}`)
    console.log(`   Email: ${attendeeDetails.email}`)
    console.log(`   College: ${attendeeDetails.college}`)
    console.log(`   Year: ${attendeeDetails.year}`)
    console.log(`   Is Group Member: ${groupMember ? 'Yes' : 'No'}`)
    console.log('✅ Ready for entry confirmation')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    res.json({
      success: true,
      message: 'Ticket verified successfully',
      data: {
        ticketNumber: ticketNumber,
        name: attendeeDetails.name,
        email: attendeeDetails.email,
        college: attendeeDetails.college,
        year: attendeeDetails.year,
        amount: registration.amount,
        registrationId: registration._id,
        isGroupMember: !!groupMember,
        groupMemberId: groupMember ? groupMember._id : null,
        isScanned: isScanned,
        entryConfirmed: entryConfirmed
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
    const { registrationId, ticketNumber, isGroupMember, groupMemberId } = req.body

    console.log('🎫 Entry confirmation request received')
    console.log('Registration ID:', registrationId)
    console.log('Ticket Number:', ticketNumber)
    console.log('Is Group Member:', isGroupMember)
    console.log('Group Member ID:', groupMemberId)

    if (!registrationId || !ticketNumber) {
      console.log('❌ Missing required fields')
      return res.status(400).json({
        success: false,
        message: 'Registration ID and ticket number are required'
      })
    }

    let registration, attendeeDetails

    if (isGroupMember && groupMemberId) {
      // Update group member's scan status
      registration = await Registration.findOneAndUpdate(
        {
          _id: registrationId,
          paymentStatus: 'completed',
          'groupMembers._id': groupMemberId,
          'groupMembers.ticketNumber': ticketNumber
        },
        {
          $set: {
            'groupMembers.$.isScanned': true,
            'groupMembers.$.scannedAt': new Date(),
            'groupMembers.$.entryConfirmed': true
          }
        },
        { new: true }
      )

      if (registration) {
        // Find the updated group member
        const groupMember = registration.groupMembers.find(member => 
          member._id.toString() === groupMemberId && member.ticketNumber === ticketNumber
        )
        attendeeDetails = {
          name: groupMember.name,
          college: groupMember.college,
          year: groupMember.year,
          ticketNumber: groupMember.ticketNumber,
          scannedAt: groupMember.scannedAt,
          entryConfirmed: groupMember.entryConfirmed
        }
      }
    } else {
      // Update primary member's scan status
      registration = await Registration.findOneAndUpdate(
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

      if (registration) {
        attendeeDetails = {
          name: registration.name,
          college: registration.college,
          year: registration.year,
          ticketNumber: registration.ticketNumber,
          scannedAt: registration.scannedAt,
          entryConfirmed: registration.entryConfirmed
        }
      }
    }

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
    console.log(`   Ticket Number: ${attendeeDetails.ticketNumber}`)
    console.log(`   Name: ${attendeeDetails.name}`)
    console.log(`   College: ${attendeeDetails.college}`)
    console.log(`   Year: ${attendeeDetails.year}`)
    console.log(`   Is Group Member: ${isGroupMember ? 'Yes' : 'No'}`)
    console.log('⏰ Entry Details:')
    console.log(`   Confirmed At: ${entryTime}`)
    console.log(`   Entry Status: GRANTED`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    res.json({
      success: true,
      message: 'Entry confirmed successfully',
      data: {
        name: attendeeDetails.name,
        ticketNumber: attendeeDetails.ticketNumber,
        scannedAt: attendeeDetails.scannedAt,
        entryConfirmed: attendeeDetails.entryConfirmed
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

// Verify ticket for multi-day events
export const verifyTicketMultiDay = async (req, res) => {
  try {
    const { qrData, eventDay } = req.body

    console.log(`📥 Day ${eventDay} verify ticket request received`)
    console.log('Request body:', JSON.stringify(req.body, null, 2))
    console.log('QR Data:', qrData)
    console.log('Event Day:', eventDay)

    if (!qrData) {
      console.log('❌ No qrData provided')
      return res.status(400).json({
        success: false,
        message: 'QR code data is required'
      })
    }

    if (!eventDay || ![1, 2].includes(eventDay)) {
      console.log('❌ Invalid event day provided')
      return res.status(400).json({
        success: false,
        message: 'Valid event day (1 or 2) is required'
      })
    }

    // Verify QR code format (reuse existing logic)
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
    console.log('Query:', { _id: registrationId, paymentStatus: 'completed' })

    // Find registration - check both primary ticket and group member tickets
    let registration = await Registration.findOne({
      _id: registrationId,
      ticketNumber: ticketNumber,
      paymentStatus: 'completed'
    })

    let isGroupMember = false
    let memberIndex = -1
    let groupMember = null

    // If not found in primary ticket, check group members
    if (!registration) {
      console.log('🔍 Not found in primary ticket, checking group members...')
      registration = await Registration.findOne({
        _id: registrationId,
        paymentStatus: 'completed',
        'groupMembers.ticketNumber': ticketNumber
      })

      if (registration) {
        isGroupMember = true
        memberIndex = registration.groupMembers.findIndex(member => member.ticketNumber === ticketNumber)
        groupMember = registration.groupMembers[memberIndex]
        console.log('✅ Found in group members, member index:', memberIndex)
      }
    }

    console.log('Database result:', registration ? '✅ Found' : '❌ Not found')
    if (registration) {
      console.log('Registration details:', {
        id: registration._id,
        ticketNumber: isGroupMember ? `Group Member - ${ticketNumber}` : registration.ticketNumber,
        name: isGroupMember ? registration.groupMembers[memberIndex].name : registration.name,
        paymentStatus: registration.paymentStatus,
        isGroupMember: isGroupMember
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

    // Check if already entered for this specific day
    console.log(`🔍 Checking Day ${eventDay} entry status...`)
    const existingEntry = await EventEntry.findOne({
      ticketNumber: ticketNumber,
      day: eventDay
    })

    if (existingEntry) {
      const entryDate = existingEntry.entryDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium'
      })

      console.log(`⚠️ DUPLICATE DAY ${eventDay} ENTRY ATTEMPT DETECTED!`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 Ticket Details:')
      console.log(`   Ticket Number: ${ticketNumber}`)
      console.log(`   Name: ${existingEntry.attendeeName}`)
      console.log(`   Email: ${existingEntry.attendeeEmail}`)
      console.log(`⏰ Previous Day ${eventDay} Entry:`)
      console.log(`   Entered At: ${entryDate}`)
      console.log(`🚫 Action: Day ${eventDay} Entry DENIED - Already used for this day`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      return res.status(400).json({
        success: false,
        message: `Already entered on Day ${eventDay}`,
        error: 'DUPLICATE_DAY_ENTRY',
        data: {
          day: eventDay,
          entryDate: existingEntry.entryDate,
          entryDateFormatted: entryDate,
          attendeeName: existingEntry.attendeeName,
          attendeeEmail: existingEntry.attendeeEmail,
          attendeeCollege: existingEntry.attendeeCollege,
          attendeeYear: existingEntry.attendeeYear,
          ticketNumber: ticketNumber,
          isGroupMember: existingEntry.isGroupMember,
          warningMessage: `This ticket was already used for Day ${eventDay} entry on ${entryDate}`
        }
      })
    }

    // Get attendee details
    let attendeeName, attendeeDetails
    if (groupMember) {
      attendeeName = groupMember.name
      attendeeDetails = {
        name: groupMember.name,
        college: groupMember.college,
        year: groupMember.year,
        email: groupMember.email,
        ticketNumber: ticketNumber
      }
    } else {
      attendeeName = registration.name
      attendeeDetails = {
        name: registration.name,
        college: registration.college,
        year: registration.year,
        email: registration.email,
        ticketNumber: registration.ticketNumber
      }
    }

    console.log(`✅ Ticket is valid for Day ${eventDay} and not yet used for this day`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`✅ DAY ${eventDay} TICKET VERIFIED SUCCESSFULLY`)
    console.log('📋 Attendee Details:')
    console.log(`   Name: ${attendeeName}`)
    console.log(`   Email: ${attendeeDetails.email}`)
    console.log(`   College: ${attendeeDetails.college}`)
    console.log(`   Year: ${attendeeDetails.year}`)
    console.log(`   Ticket Number: ${ticketNumber}`)
    console.log(`   Group Member: ${isGroupMember ? 'Yes' : 'No'}`)
    console.log(`   Valid for Day: ${eventDay}`)
    console.log('🎯 Next Step: Confirm entry to grant access')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Return verification result
    res.json({
      success: true,
      data: {
        registrationId: registrationId,
        ticketNumber: ticketNumber,
        name: attendeeDetails.name,
        email: attendeeDetails.email,
        college: attendeeDetails.college,
        year: attendeeDetails.year,
        amount: registration.amount,
        isGroupMember: isGroupMember,
        groupMemberId: groupMember ? groupMember._id : null,
        canEnterDay: eventDay,
        hasEntered: false,
        validForDay: eventDay
      }
    })

  } catch (error) {
    console.error('Multi-day ticket verification error:', error)
    res.status(500).json({
      success: false,
      message: 'Multi-day ticket verification failed'
    })
  }
}

// Confirm multi-day entry
export const confirmEntryMultiDay = async (req, res) => {
  try {
    const { registrationId, ticketNumber, eventDay, isGroupMember, groupMemberId } = req.body

    console.log(`🎫 Day ${eventDay} entry confirmation request received`)
    console.log('Registration ID:', registrationId)
    console.log('Ticket Number:', ticketNumber)
    console.log('Event Day:', eventDay)
    console.log('Is Group Member:', isGroupMember)
    console.log('Group Member ID:', groupMemberId)

    if (!registrationId || !ticketNumber || !eventDay) {
      console.log('❌ Missing required fields')
      return res.status(400).json({
        success: false,
        message: 'Registration ID, ticket number, and event day are required'
      })
    }

    if (![1, 2].includes(eventDay)) {
      console.log('❌ Invalid event day')
      return res.status(400).json({
        success: false,
        message: 'Valid event day (1 or 2) is required'
      })
    }

    // Get registration details for attendee info
    let registration = await Registration.findOne({
      _id: registrationId,
      paymentStatus: 'completed'
    })

    if (!registration) {
      console.log('❌ Registration not found for entry confirmation')
      return res.status(404).json({
        success: false,
        message: 'Registration not found or invalid ticket'
      })
    }

    let attendeeDetails, bookingEmail = registration.email

    if (isGroupMember && groupMemberId) {
      // Find group member
      const groupMember = registration.groupMembers.find(member => 
        member._id.toString() === groupMemberId && member.ticketNumber === ticketNumber
      )
      
      if (!groupMember) {
        console.log('❌ Group member not found')
        return res.status(404).json({
          success: false,
          message: 'Group member not found'
        })
      }

      attendeeDetails = {
        name: groupMember.name,
        email: groupMember.email,
        college: groupMember.college,
        year: groupMember.year,
        ticketNumber: groupMember.ticketNumber
      }
    } else {
      attendeeDetails = {
        name: registration.name,
        email: registration.email,
        college: registration.college,
        year: registration.year,
        ticketNumber: registration.ticketNumber
      }
    }

    // Create entry record
    try {
      const entryRecord = new EventEntry({
        registrationId: registrationId,
        ticketNumber: ticketNumber,
        attendeeName: attendeeDetails.name,
        attendeeEmail: attendeeDetails.email,
        attendeeCollege: attendeeDetails.college,
        attendeeYear: attendeeDetails.year,
        day: eventDay,
        entryDate: new Date(),
        isGroupMember: isGroupMember || false,
        groupMemberId: groupMemberId || null,
        bookingEmail: bookingEmail
      })

      await entryRecord.save()

      const entryTime = entryRecord.entryDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium'
      })

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`🎉 DAY ${eventDay} ENTRY CONFIRMED SUCCESSFULLY`)
      console.log('📋 Attendee Information:')
      console.log(`   Ticket Number: ${ticketNumber}`)
      console.log(`   Name: ${attendeeDetails.name}`)
      console.log(`   Email: ${attendeeDetails.email}`)
      console.log(`   College: ${attendeeDetails.college}`)
      console.log(`   Year: ${attendeeDetails.year}`)
      console.log(`⏰ Day ${eventDay} Entry Details:`)
      console.log(`   Confirmed At: ${entryTime}`)
      console.log(`   Entry Status: GRANTED FOR DAY ${eventDay}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      res.json({
        success: true,
        message: `Entry confirmed for Day ${eventDay}!`,
        data: {
          day: eventDay,
          entryId: entryRecord._id,
          registrationId: entryRecord.registrationId,
          ticketNumber: entryRecord.ticketNumber,
          attendeeName: entryRecord.attendeeName,
          attendeeEmail: entryRecord.attendeeEmail,
          entryDate: entryRecord.entryDate,
          entryDateFormatted: entryTime,
          isGroupMember: entryRecord.isGroupMember
        }
      })

    } catch (saveError) {
      // Handle duplicate entry error
      if (saveError.code === 11000) {
        console.log(`⚠️ Duplicate Day ${eventDay} entry attempt blocked by database constraint`)
        return res.status(400).json({
          success: false,
          message: `Already entered on Day ${eventDay}`,
          error: 'DUPLICATE_DAY_ENTRY'
        })
      }
      throw saveError
    }

  } catch (error) {
    console.error('Multi-day entry confirmation error:', error)
    res.status(500).json({
      success: false,
      message: 'Multi-day entry confirmation failed'
    })
  }
}

// Get multi-day attendance statistics
export const getMultiDayStats = async (req, res) => {
  try {
    // Get daily stats
    const dailyStats = await EventEntry.getDailyStats()
    
    // Get both days attendees
    const bothDaysAttendees = await EventEntry.getBothDaysAttendees()
    
    // Get total unique attendees
    const totalUniqueAttendees = await EventEntry.distinct('ticketNumber')
    
    // Get day-wise breakdown
    const day1Count = dailyStats.find(stat => stat.day === 1)?.totalEntries || 0
    const day2Count = dailyStats.find(stat => stat.day === 2)?.totalEntries || 0
    
    res.json({
      success: true,
      data: {
        day1Entries: day1Count,
        day2Entries: day2Count,
        totalUniqueAttendees: totalUniqueAttendees.length,
        bothDaysAttendees: bothDaysAttendees.length,
        dailyBreakdown: dailyStats,
        bothDaysAttendeesDetails: bothDaysAttendees
      }
    })

  } catch (error) {
    console.error('Error fetching multi-day stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch multi-day statistics'
    })
  }
}

// Get attendance statistics
export const getAttendanceStats = async (req, res) => {
  try {
    // Get total tickets (including group members)
    const registrations = await Registration.find({ paymentStatus: 'completed' })
    
    let totalTickets = 0
    let scannedTickets = 0
    let confirmedEntries = 0
    
    for (const registration of registrations) {
      if (registration.isGroupBooking && registration.groupMembers && registration.groupMembers.length > 0) {
        // Group booking - count all members
        totalTickets += registration.groupMembers.length
        
        // Count scanned group members
        for (const member of registration.groupMembers) {
          if (member.isScanned) scannedTickets++
          if (member.entryConfirmed) confirmedEntries++
        }
      } else {
        // Individual booking
        totalTickets += 1
        if (registration.isScanned) scannedTickets++
        if (registration.entryConfirmed) confirmedEntries++
      }
    }

    res.json({
      success: true,
      data: {
        totalRegistrations: registrations.length,
        totalTickets,
        scannedTickets,
        confirmedEntries,
        pendingEntries: totalTickets - scannedTickets
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
    const registrations = await Registration.find({
      paymentStatus: 'completed'
    }).sort({ createdAt: -1 })

    const scannedTickets = []

    for (const registration of registrations) {
      if (registration.isGroupBooking && registration.groupMembers && registration.groupMembers.length > 0) {
        // Add scanned group members
        for (const member of registration.groupMembers) {
          if (member.isScanned) {
            scannedTickets.push({
              name: member.name,
              email: member.email, // Use the group member's own email
              college: member.college,
              year: member.year,
              ticketNumber: member.ticketNumber,
              scannedAt: member.scannedAt,
              entryConfirmed: member.entryConfirmed,
              isGroupMember: true,
              bookingEmail: registration.email
            })
          }
        }
      } else {
        // Individual booking
        if (registration.isScanned) {
          scannedTickets.push({
            name: registration.name,
            email: registration.email,
            college: registration.college,
            year: registration.year,
            ticketNumber: registration.ticketNumber,
            scannedAt: registration.scannedAt,
            entryConfirmed: registration.entryConfirmed,
            isGroupMember: false
          })
        }
      }
    }

    // Sort by scan time (most recent first)
    scannedTickets.sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt))

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