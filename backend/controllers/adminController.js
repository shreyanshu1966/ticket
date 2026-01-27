import Registration from '../models/Registration.js'
import { validationResult } from 'express-validator'
import { sendBulkNotification as sendBulkEmail, sendPendingPaymentEmail, sendTimingCorrectionEmail, sendNewTimingUpdateEmail, sendConfirmationEmail, sendGroupConfirmationEmails, sendBringFriendPromotionEmail } from '../services/emailService.js'

// Admin Dashboard Statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Count total individuals (individual registrations + group leaders + group members)
    // Handle legacy data where isGroupBooking might not exist
    const totalRegistrationsStats = await Registration.aggregate([
      {
        $group: {
          _id: null,
          individualRegistrations: {
            $sum: {
              $cond: [
                { $or: [
                  { $eq: ['$isGroupBooking', false] },
                  { $eq: [{ $type: '$isGroupBooking' }, 'missing'] }
                ]},
                1,
                0
              ]
            }
          },
          groupLeaders: {
            $sum: {
              $cond: [{ $eq: ['$isGroupBooking', true] }, 1, 0]
            }
          },
          groupMembers: {
            $sum: {
              $cond: [
                { $eq: ['$isGroupBooking', true] },
                { $size: { $ifNull: ['$groupMembers', []] } },
                0
              ]
            }
          }
        }
      }
    ])

    const totalRegistrations = totalRegistrationsStats.length > 0 
      ? totalRegistrationsStats[0].individualRegistrations + totalRegistrationsStats[0].groupLeaders + totalRegistrationsStats[0].groupMembers 
      : 0

    // Count payments by status
    const completedPayments = await Registration.countDocuments({ 
      paymentStatus: { $in: ['completed', 'verified'] } 
    })
    const pendingPayments = await Registration.countDocuments({ 
      paymentStatus: 'pending'
    })
    const failedPayments = await Registration.countDocuments({ 
      paymentStatus: { $in: ['failed', 'verification_failed'] } 
    })

    // Group booking statistics (number of group bookings, not individual people)
    const groupBookings = await Registration.countDocuments({ isGroupBooking: true })
    
    // Calculate total tickets - only count completed/verified payments
    // Handle legacy data where ticketQuantity might not exist (default to 1)
    const ticketStats = await Registration.aggregate([
      {
        $match: {
          paymentStatus: { $in: ['completed', 'verified'] }
        }
      },
      {
        $group: {
          _id: null,
          totalTickets: { 
            $sum: { 
              $ifNull: ['$ticketQuantity', 1]
            }
          }
        }
      }
    ])
    const totalTickets = ticketStats.length > 0 ? ticketStats[0].totalTickets : 0

    // Calculate total savings from group offers (Buy 3 Get 1 Free)
    const savingsStats = await Registration.aggregate([
      {
        $match: { 
          isGroupBooking: true,
          ticketQuantity: { $gte: 4 },
          paymentStatus: { $in: ['completed', 'verified', 'pending', 'paid_awaiting_verification'] }
        }
      },
      {
        $group: {
          _id: null,
          totalSavings: {
            $sum: {
              $multiply: [
                { $floor: { $divide: ['$ticketQuantity', 4] } },
                19900
              ]
            }
          }
        }
      }
    ])

    // Add friend referral savings (₹99 saved per referred friend)
    const friendReferralSavings = await Registration.aggregate([
      {
        $match: {
          isFriendReferral: true,
          paymentStatus: { $in: ['completed', 'verified', 'pending', 'paid_awaiting_verification'] }
        }
      },
      {
        $group: {
          _id: null,
          totalSavings: { 
            $sum: 9900 // ₹99 saved per friend referral (₹199 - ₹100 = ₹99)
          }
        }
      }
    ])

    const totalSavings = (savingsStats.length > 0 ? savingsStats[0].totalSavings : 0) + 
                        (friendReferralSavings.length > 0 ? friendReferralSavings[0].totalSavings : 0)

    // Get registrations by year
    const yearStats = await Registration.aggregate([
      {
        $group: {
          _id: '$year',
          count: { $sum: 1 }
        }
      }
    ])

    // Get recent registrations (last 10) with group booking info
    const recentRegistrations = await Registration.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email college paymentStatus isGroupBooking ticketQuantity createdAt')

    // Calculate total revenue - only from completed payments
    // Properly handle individual, group bookings, and friend referrals
    const totalRevenue = await Registration.aggregate([
      { $match: { paymentStatus: { $in: ['completed', 'verified'] } } },
      { 
        $group: { 
          _id: null, 
          total: { 
            $sum: {
              $cond: [
                // For group bookings, use totalAmount
                { $eq: ['$isGroupBooking', true] },
                '$totalAmount',
                // For friend referrals, friend pays ₹100 (10000 paise)
                {
                  $cond: [
                    { $eq: ['$isFriendReferral', true] },
                    10000, // ₹100 for referred friend
                    // For regular individual registrations (including referrers), use ₹199
                    19900 // ₹199 for individual/referrer
                  ]
                }
              ]
            }
          } 
        } 
      }
    ])

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total / 100 : 0

    // Get entry statistics - count individual people confirmed (not just registrations)
    const entriesConfirmedStats = await Registration.aggregate([
      {
        $match: { entryConfirmed: true }
      },
      {
        $group: {
          _id: null,
          individualEntries: {
            $sum: {
              $cond: [{ $eq: ['$isGroupBooking', false] }, 1, 0]
            }
          },
          groupLeaderEntries: {
            $sum: {
              $cond: [{ $eq: ['$isGroupBooking', true] }, 1, 0]
            }
          },
          groupMemberEntries: {
            $sum: {
              $reduce: {
                input: { $ifNull: ['$groupMembers', []] },
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $eq: ['$$this.entryConfirmed', true] }, 1, 0] }
                  ]
                }
              }
            }
          }
        }
      }
    ])

    const totalEntriesConfirmed = entriesConfirmedStats.length > 0 
      ? entriesConfirmedStats[0].individualEntries + entriesConfirmedStats[0].groupLeaderEntries + entriesConfirmedStats[0].groupMemberEntries
      : 0

    // Get scanned statistics - count individual people scanned
    const scannedStats = await Registration.aggregate([
      {
        $match: { isScanned: true }
      },
      {
        $group: {
          _id: null,
          individualScanned: {
            $sum: {
              $cond: [{ $eq: ['$isGroupBooking', false] }, 1, 0]
            }
          },
          groupLeaderScanned: {
            $sum: {
              $cond: [{ $eq: ['$isGroupBooking', true] }, 1, 0]
            }
          },
          groupMemberScanned: {
            $sum: {
              $reduce: {
                input: { $ifNull: ['$groupMembers', []] },
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $eq: ['$$this.isScanned', true] }, 1, 0] }
                  ]
                }
              }
            }
          }
        }
      }
    ])

    const totalScanned = scannedStats.length > 0 
      ? scannedStats[0].individualScanned + scannedStats[0].groupLeaderScanned + scannedStats[0].groupMemberScanned
      : 0

    const awaitingVerification = await Registration.countDocuments({ paymentStatus: 'paid_awaiting_verification' })

    res.json({
      success: true,
      data: {
        totalRegistrations,
        totalTickets,
        groupBookings,
        completedPayments,
        pendingPayments,
        failedPayments,
        totalRevenue: revenue,
        totalSavings: totalSavings / 100, // Convert paise to rupees
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
      .populate('referredBy', 'name email') // Populate referrer information

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
      bookingType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    // Build filter object
    const filter = {}
    if (paymentStatus) filter.paymentStatus = paymentStatus
    if (year) filter.year = year
    
    // Handle booking type filter
    if (bookingType) {
      switch (bookingType) {
        case 'group':
          filter.isGroupBooking = true
          break
        case 'individual':
          filter.isGroupBooking = false
          filter.isFriendReferral = false
          break
        case 'referral':
          filter.isFriendReferral = true
          break
      }
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { college: { $regex: search, $options: 'i' } },
        { upiTransactionId: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get registrations - EXCLUDE heavy fields like paymentScreenshot
    // This dramatically improves performance as screenshots can be several MB each
    const registrations = await Registration.find(filter)
      .populate('referredBy', 'name email') // Populate referrer information
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
    const { paymentStatus, year, isGroupBooking } = req.query

    // Build filter
    const filter = {}
    if (paymentStatus) filter.paymentStatus = paymentStatus
    if (year) filter.year = year
    if (isGroupBooking !== undefined) {
      filter.isGroupBooking = isGroupBooking === 'true'
    }

    const registrations = await Registration.find(filter)
      .sort({ createdAt: -1 })

    // Convert to CSV format data with comprehensive fields including group booking info
    const csvData = registrations.map(reg => ({
      'Registration ID': reg._id.toString(),
      'Ticket Number': reg.ticketNumber || 'N/A',
      Name: reg.name,
      Email: reg.email,
      Phone: reg.phone,
      College: reg.college,
      Year: reg.year,
      'Booking Type': reg.isGroupBooking ? 'Group' : 'Individual',
      'Ticket Quantity': reg.ticketQuantity || 1,
      'Free Tickets': reg.isGroupBooking && reg.ticketQuantity >= 4 ? Math.floor(reg.ticketQuantity / 4) : 0,
      'Total Amount (₹)': reg.totalAmount ? (reg.totalAmount / 100).toFixed(2) : (reg.amount ? (reg.amount / 100).toFixed(2) : '0.00'),
      'Savings (₹)': reg.isGroupBooking && reg.ticketQuantity >= 4 ? (Math.floor(reg.ticketQuantity / 4) * 199).toFixed(2) : '0.00',
      'Payment Status': reg.paymentStatus,
      'Payment Method': reg.paymentMethod || 'N/A',
      'UPI Transaction ID': reg.upiTransactionId || 'N/A',
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
      'Rejection Reason': reg.paymentRejectionReason || 'N/A',
      'Group Members Count': reg.isGroupBooking && reg.groupMembers ? reg.groupMembers.length : 0
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

// Send new timing update emails (Day 1: 10 AM - 6 PM)
export const sendNewTimingUpdate = async (req, res) => {
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

    console.log(`📧 Sending new timing update emails to ${registrations.length} recipients...`)

    let sent = 0
    let failed = 0
    const errors = []

    // Send new timing update email to each recipient
    for (const registration of registrations) {
      try {
        const result = await sendNewTimingUpdateEmail(registration)
        if (result.success) {
          sent++
          console.log(`✅ New timing update email sent to ${registration.email}`)
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
      message: `New timing update emails sent! ${sent} emails sent${failed > 0 ? `, ${failed} failed` : ''}`,
      data: {
        sent,
        failed,
        total: registrations.length,
        targetGroup,
        subject: '⏰ Important Update: New Event Timing for Day 1 - ACD 2026',
        errors: errors
      }
    })
  } catch (error) {
    console.error('Error sending new timing update emails:', error)
    res.status(500).json({
      success: false,
      message: 'Error sending new timing update emails: ' + error.message
    })
  }
}

// Send Bring Friend Offer Promotion Emails
export const sendBringFriendPromotion = async (req, res) => {
  try {
    const { targetGroup = 'completed' } = req.body

    // Build filter - EXACT same eligibility check as bring-friend form
    // Criteria from friendController.checkEligibility:
    // 1. Payment must be completed (not just verified)
    // 2. NOT a group booking user
    // 3. NOT a friend referral themselves
    // 4. Has NOT already referred a friend
    const filter = {
      paymentStatus: 'completed',  // Only completed payments, matching bring-friend eligibility
      isGroupBooking: { $ne: true },  // Group booking users cannot refer friends
      isFriendReferral: { $ne: true },  // Friend referrals cannot refer other friends
      hasReferredFriend: { $ne: true }  // Users who already referred cannot refer again
    }

    if (targetGroup === 'individual') {
      // Already filtered by isGroupBooking: false above
      // No additional filter needed
    } else if (targetGroup === 'group') {
      // Skip - group bookings are not eligible
      return res.json({
        success: true,
        message: 'Group booking users are not eligible to refer friends',
        data: {
          sent: 0,
          failed: 0,
          total: 0,
          targetGroup
        }
      })
    }
    // 'all' or 'completed' means send to all eligible individual completed registrations

    const registrations = await Registration.find(filter).select('name email')

    if (registrations.length === 0) {
      return res.json({
        success: true,
        message: 'No eligible recipients found for bring friend promotion',
        data: {
          sent: 0,
          failed: 0,
          total: 0,
          targetGroup
        }
      })
    }

    console.log(`🎁 Sending bring friend promotion emails to ${registrations.length} recipients...`)

    let sent = 0
    let failed = 0
    const errors = []

    // Send bring friend promotion email to each recipient
    for (const registration of registrations) {
      try {
        const result = await sendBringFriendPromotionEmail(registration)
        if (result.success) {
          sent++
          console.log(`✅ Bring friend promotion email sent to ${registration.email}`)
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
      message: `Bring friend promotion emails sent! ${sent} emails sent${failed > 0 ? `, ${failed} failed` : ''}`,
      data: {
        sent,
        failed,
        total: registrations.length,
        targetGroup,
        errors
      }
    })
  } catch (error) {
    console.error('Error sending bring friend promotion emails:', error)
    res.status(500).json({
      success: false,
      message: 'Error sending bring friend promotion emails: ' + error.message
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

        // ✅ FIX: Handle group bookings properly like in original registration flow
        let result
        if (registration.isGroupBooking) {
          console.log(`📧 Resending group confirmation emails for ${registration.ticketQuantity} tickets to ${registration.email}`)
          result = await sendGroupConfirmationEmails(registration)
        } else {
          console.log(`📧 Resending individual ticket to ${registration.email}`)
          result = await sendConfirmationEmail(registration)
        }
        
        if (result.success) {
          sent++
          console.log(`✅ Ticket resent to ${registration.email}${registration.isGroupBooking ? ' and all group members' : ''}`)

          // ✅ CRITICAL FIX: ALWAYS update ticket data, regardless of ticketGenerated status
          // This prevents ticket number mismatches and scanner failures
          registration.ticketGenerated = true
          registration.ticketNumber = result.ticketNumber || result.primaryTicketNumber
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

// Friend Offer Management
export const getFriendOfferSettings = async (req, res) => {
  try {
    const AdminSettings = (await import('../models/AdminSettings.js')).default
    
    const isEnabled = await AdminSettings.getSetting('friendOfferEnabled')
    const topUpAmount = await AdminSettings.getSetting('friendOfferTopUpAmount')
    
    // Get friend referral statistics
    const totalFriendReferrals = await Registration.countDocuments({ isFriendReferral: true })
    const completedFriendPayments = await Registration.countDocuments({ 
      isFriendReferral: true,
      paymentStatus: 'completed'
    })
    const pendingFriendPayments = await Registration.countDocuments({
      isFriendReferral: true, 
      paymentStatus: { $in: ['pending', 'paid_awaiting_verification'] }
    })
    
    // Get recent friend registrations
    const recentFriendRegistrations = await Registration.find({ isFriendReferral: true })
      .populate('referredBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email college paymentStatus friendReferralTopUp friendDiscountApplied createdAt referredBy')

    res.json({
      success: true,
      data: {
        enabled: isEnabled ?? true,
        topUpAmount: topUpAmount ?? 10000,
        statistics: {
          totalFriendReferrals,
          completedFriendPayments,
          pendingFriendPayments
        },
        recentRegistrations: recentFriendRegistrations
      }
    })
  } catch (error) {
    console.error('Error fetching friend offer settings:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching friend offer settings'
    })
  }
}

export const toggleFriendOffer = async (req, res) => {
  try {
    const AdminSettings = (await import('../models/AdminSettings.js')).default
    const { enabled, adminName } = req.body
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled field must be a boolean'
      })
    }

    await AdminSettings.updateSetting('friendOfferEnabled', enabled, adminName || 'Admin')

    res.json({
      success: true,
      message: `Friend offer ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: { enabled }
    })
  } catch (error) {
    console.error('Error toggling friend offer:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating friend offer setting'
    })
  }
}

export const getFriendRegistrations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    // Get friend registrations with referrer information
    const friendRegistrations = await Registration.find({ isFriendReferral: true })
      .populate('referredBy', 'name email ticketNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name email phone college year paymentStatus friendReferralTopUp friendDiscountApplied originalAmount amount createdAt paymentSubmittedAt adminVerifiedAt referredBy')

    const totalCount = await Registration.countDocuments({ isFriendReferral: true })

    res.json({
      success: true,
      data: {
        registrations: friendRegistrations,
        pagination: {
          current: page,
          total: Math.ceil(totalCount / limit),
          count: friendRegistrations.length,
          totalItems: totalCount
        }
      }
    })
  } catch (error) {
    console.error('Error fetching friend registrations:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching friend registrations'
    })
  }
}
