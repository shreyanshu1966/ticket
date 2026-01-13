import Registration from '../models/Registration.js'
import { validationResult } from 'express-validator'
import { sendBulkNotification as sendBulkEmail, sendPendingPaymentEmail, sendTimingCorrectionEmail, sendConfirmationEmail } from '../services/emailService.js'

// Admin Dashboard Statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalRegistrations = await Registration.countDocuments()
    const completedPayments = await Registration.countDocuments({ paymentStatus: 'completed' })
    const pendingPayments = await Registration.countDocuments({ paymentStatus: 'pending' })
    const failedPayments = await Registration.countDocuments({ paymentStatus: 'failed' })

    // Get registrations by year
    const yearStats = await Registration.aggregate([
      {
        $group: {
          _id: '$year',
          count: { $sum: 1 }
        }
      }
    ])

    // Get recent registrations (last 10)
    const recentRegistrations = await Registration.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email college paymentStatus createdAt')

    // Calculate total revenue
    const totalRevenue = await Registration.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total / 100 : 0

    // Get entry statistics
    const totalEntriesConfirmed = await Registration.countDocuments({ entryConfirmed: true })
    const totalScanned = await Registration.countDocuments({ isScanned: true })
    const awaitingVerification = await Registration.countDocuments({ paymentStatus: 'paid_awaiting_verification' })

    res.json({
      success: true,
      data: {
        totalRegistrations,
        completedPayments,
        pendingPayments,
        failedPayments,
        totalRevenue: revenue,
        totalEntriesConfirmed,
        totalScanned,
        awaitingVerification,
        yearStats,
        recentRegistrations
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    })
  }
}

// Get a single registration by ID with full details (including payment screenshot)
export const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params

    const registration = await Registration.findById(id)

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      })
    }

    res.json({
      success: true,
      data: registration
    })
  } catch (error) {
    console.error('Error fetching registration:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching registration details'
    })
  }
}

// Get all registrations with advanced filtering
export const getAllRegistrations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      paymentStatus,
      year,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    // Build filter object
    const filter = {}
    if (paymentStatus) filter.paymentStatus = paymentStatus
    if (year) filter.year = year
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { college: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get registrations - EXCLUDE heavy fields like paymentScreenshot
    // This dramatically improves performance as screenshots can be several MB each
    const registrations = await Registration.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v -paymentScreenshot') // Exclude version and screenshot
      .lean() // Convert to plain JS objects for better performance

    // Get total count for pagination
    const total = await Registration.countDocuments(filter)

    res.json({
      success: true,
      data: registrations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching registrations:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations'
    })
  }
}

// Update registration status
export const updateRegistrationStatus = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      })
    }

    const { id } = req.params
    const { paymentStatus } = req.body

    const registration = await Registration.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true, runValidators: true }
    )

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      })
    }

    res.json({
      success: true,
      message: 'Registration status updated successfully',
      data: registration
    })
  } catch (error) {
    console.error('Error updating registration status:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating registration status'
    })
  }
}

// Delete registration
export const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params

    const registration = await Registration.findByIdAndDelete(id)

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      })
    }

    res.json({
      success: true,
      message: 'Registration deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting registration:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting registration'
    })
  }
}

// Export registrations to CSV format data
export const exportRegistrations = async (req, res) => {
  try {
    const { paymentStatus, year } = req.query

    // Build filter
    const filter = {}
    if (paymentStatus) filter.paymentStatus = paymentStatus
    if (year) filter.year = year

    const registrations = await Registration.find(filter)
      .sort({ createdAt: -1 })

    // Convert to CSV format data with comprehensive fields
    const csvData = registrations.map(reg => ({
      'Ticket Number': reg.ticketNumber || 'N/A',
      Name: reg.name,
      Email: reg.email,
      Phone: reg.phone,
      College: reg.college,
      Year: reg.year,
      'Payment Status': reg.paymentStatus,
      'Payment Method': reg.paymentMethod || 'N/A',
      'UPI Transaction ID': reg.upiTransactionId || 'N/A',
      'Amount (₹)': reg.amount ? (reg.amount / 100).toFixed(2) : '0.00',
      'Registration Date': reg.createdAt ? new Date(reg.createdAt).toLocaleString('en-IN') : 'N/A',
      'Payment Submitted At': reg.paymentSubmittedAt ? new Date(reg.paymentSubmittedAt).toLocaleString('en-IN') : 'N/A',
      'Admin Verified At': reg.adminVerifiedAt ? new Date(reg.adminVerifiedAt).toLocaleString('en-IN') : 'N/A',
      'Admin Verified By': reg.adminVerifiedBy || 'N/A',
      'Payment Date': reg.paymentDate ? new Date(reg.paymentDate).toLocaleString('en-IN') : 'N/A',
      'Ticket Generated': reg.ticketGenerated ? 'Yes' : 'No',
      'Email Sent At': reg.emailSentAt ? new Date(reg.emailSentAt).toLocaleString('en-IN') : 'N/A',
      'Is Scanned': reg.isScanned ? 'Yes' : 'No',
      'Scanned At': reg.scannedAt ? new Date(reg.scannedAt).toLocaleString('en-IN') : 'N/A',
      'Entry Confirmed': reg.entryConfirmed ? 'Yes' : 'No',
      'Resend Count': reg.resendCount || 0,
      'Last Resent At': reg.lastResentAt ? new Date(reg.lastResentAt).toLocaleString('en-IN') : 'N/A',
      'Payment Notes': reg.paymentNotes || 'N/A',
      'Rejection Reason': reg.paymentRejectionReason || 'N/A'
    }))

    res.json({
      success: true,
      data: csvData,
      count: csvData.length
    })
  } catch (error) {
    console.error('Error exporting registrations:', error)
    res.status(500).json({
      success: false,
      message: 'Error exporting registrations'
    })
  }
}

// Send bulk notifications using nodemailer
export const sendBulkNotification = async (req, res) => {
  try {
    const { subject, message, targetGroup } = req.body

    // Build filter based on target group
    const filter = {}
    if (targetGroup === 'completed') filter.paymentStatus = 'completed'
    if (targetGroup === 'pending') filter.paymentStatus = 'pending'
    if (targetGroup === 'failed') filter.paymentStatus = 'failed'
    // 'all' means no filter

    const registrations = await Registration.find(filter).select('name email college year amount createdAt')

    if (registrations.length === 0) {
      return res.json({
        success: true,
        message: 'No recipients found for the selected target group',
        data: {
          sent: 0,
          failed: 0,
          total: 0,
          targetGroup,
          subject,
          message
        }
      })
    }

    // Special handling for pending payments - use designed template
    if (targetGroup === 'pending') {
      console.log(`📧 Sending designed pending payment emails to ${registrations.length} recipients...`)

      let sent = 0
      let failed = 0
      const errors = []

      // Send designed pending payment email to each recipient
      for (const registration of registrations) {
        try {
          const result = await sendPendingPaymentEmail(registration)
          if (result.success) {
            sent++
            console.log(`✅ Pending payment email sent to ${registration.email}`)
          } else {
            failed++
            errors.push({
              email: registration.email,
              error: result.error
            })
            console.error(`❌ Failed to send to ${registration.email}:`, result.error)
          }

          // Small delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          failed++
          errors.push({
            email: registration.email,
            error: error.message
          })
          console.error(`❌ Error sending to ${registration.email}:`, error.message)
        }
      }

      return res.json({
        success: true,
        message: `Pending payment notifications sent! ${sent} emails sent${failed > 0 ? `, ${failed} failed` : ''}`,
        data: {
          sent,
          failed,
          total: registrations.length,
          targetGroup,
          templateUsed: 'Designed Pending Payment Template (with countdown timer & early bird offer)',
          subject: '⏰ Complete Your Registration - Early Bird Offer Active | ACD 2026',
          errors: errors
        }
      })
    }

    // For other groups, use basic bulk notification template
    const emailResult = await sendBulkEmail(registrations, subject, message)

    if (emailResult.success) {
      res.json({
        success: true,
        message: `Notification sent successfully! ${emailResult.sent} emails sent${emailResult.failed > 0 ? `, ${emailResult.failed} failed` : ''}`,
        data: {
          sent: emailResult.sent,
          failed: emailResult.failed,
          total: emailResult.total,
          targetGroup,
          subject,
          message,
          errors: emailResult.errors || []
        }
      })
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to send notifications: ${emailResult.error}`,
        data: {
          sent: emailResult.sent,
          failed: emailResult.failed,
          total: emailResult.total,
          targetGroup,
          errors: emailResult.errors || []
        }
      })
    }
  } catch (error) {
    console.error('Error sending bulk notification:', error)
    res.status(500).json({
      success: false,
      message: 'Error sending bulk notification: ' + error.message
    })
  }
}

// Send timing correction emails
export const sendTimingCorrection = async (req, res) => {
  try {
    const { targetGroup = 'all' } = req.body

    // Build filter based on target group
    const filter = {}
    if (targetGroup === 'completed') filter.paymentStatus = 'completed'
    if (targetGroup === 'pending') filter.paymentStatus = 'pending'
    if (targetGroup === 'all') {
      // Send to everyone who has registered
      filter.$or = [
        { paymentStatus: 'completed' },
        { paymentStatus: 'pending' },
        { paymentStatus: 'paid_awaiting_verification' }
      ]
    }

    const registrations = await Registration.find(filter).select('name email')

    if (registrations.length === 0) {
      return res.json({
        success: true,
        message: 'No recipients found for the selected target group',
        data: {
          sent: 0,
          failed: 0,
          total: 0,
          targetGroup
        }
      })
    }

    console.log(`📧 Sending timing correction emails to ${registrations.length} recipients...`)

    let sent = 0
    let failed = 0
    const errors = []

    // Send timing correction email to each recipient
    for (const registration of registrations) {
      try {
        const result = await sendTimingCorrectionEmail(registration)
        if (result.success) {
          sent++
          console.log(`✅ Timing correction email sent to ${registration.email}`)
        } else {
          failed++
          errors.push({
            email: registration.email,
            error: result.error
          })
          console.error(`❌ Failed to send to ${registration.email}:`, result.error)
        }

        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        failed++
        errors.push({
          email: registration.email,
          error: error.message
        })
        console.error(`❌ Error sending to ${registration.email}:`, error.message)
      }
    }

    return res.json({
      success: true,
      message: `Timing correction emails sent! ${sent} emails sent${failed > 0 ? `, ${failed} failed` : ''}`,
      data: {
        sent,
        failed,
        total: registrations.length,
        targetGroup,
        subject: '⚠️ Important Update: Event Timing Correction - ACD 2026',
        errors: errors
      }
    })
  } catch (error) {
    console.error('Error sending timing correction emails:', error)
    res.status(500).json({
      success: false,
      message: 'Error sending timing correction emails: ' + error.message
    })
  }
}

// Resend tickets to users
export const resendTickets = async (req, res) => {
  try {
    const { targetGroup = 'completed' } = req.body

    // Build filter - only send to users with completed payments
    const filter = { paymentStatus: 'completed' }

    // Optional: filter by specific group if needed
    if (targetGroup === 'ticket_sent') {
      filter.ticketGenerated = true
    } else if (targetGroup === 'no_ticket') {
      filter.ticketGenerated = false
    }

    const registrations = await Registration.find(filter)

    if (registrations.length === 0) {
      return res.json({
        success: true,
        message: 'No recipients found for the selected target group',
        data: {
          sent: 0,
          failed: 0,
          total: 0,
          targetGroup
        }
      })
    }

    console.log(`🎫 Resending tickets to ${registrations.length} recipients...`)

    let sent = 0
    let failed = 0
    const errors = []

    // Resend tickets to each recipient
    for (const registration of registrations) {
      try {
        // Skip if recently resent (within last 2 minutes) to prevent duplicates
        if (registration.lastResentAt) {
          const timeSinceLastResend = Date.now() - new Date(registration.lastResentAt).getTime()
          if (timeSinceLastResend < 120000) { // 2 minutes
            console.log(`⏭️ Skipping ${registration.email} - resent ${Math.round(timeSinceLastResend / 1000)}s ago`)
            continue
          }
        }

        const result = await sendConfirmationEmail(registration)
        if (result.success) {
          sent++
          console.log(`✅ Ticket resent to ${registration.email}`)

          // ✅ CRITICAL FIX: ALWAYS update ticket data, regardless of ticketGenerated status
          // This prevents ticket number mismatches and scanner failures
          registration.ticketGenerated = true
          registration.ticketNumber = result.ticketNumber
          registration.qrCode = result.qrCode
          registration.emailSentAt = new Date()  // Update to latest resend time

          // Track resend attempts for audit trail
          registration.resendCount = (registration.resendCount || 0) + 1
          registration.lastResentAt = new Date()

          await registration.save()
        } else {
          failed++
          errors.push({
            email: registration.email,
            registrationId: registration._id,
            error: result.error,
            timestamp: new Date()
          })
          console.error(`❌ Failed to resend ticket to ${registration.email}:`, result.error)
        }

        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        failed++
        errors.push({
          email: registration.email,
          registrationId: registration._id,
          error: error.message,
          timestamp: new Date()
        })
        console.error(`❌ Error resending ticket to ${registration.email}:`, error.message)
      }
    }

    return res.json({
      success: true,
      message: `Tickets resent! ${sent} emails sent${failed > 0 ? `, ${failed} failed` : ''}`,
      data: {
        sent,
        failed,
        total: registrations.length,
        targetGroup,
        subject: 'Your E-Ticket - ACD 2026',
        errors: errors
      }
    })
  } catch (error) {
    console.error('Error resending tickets:', error)
    res.status(500).json({
      success: false,
      message: 'Error resending tickets: ' + error.message
    })
  }
}
