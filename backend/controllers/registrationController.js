import { validationResult } from 'express-validator'
import Registration from '../models/Registration.js'
import { sendConfirmationEmail, sendGroupConfirmationEmails } from '../services/emailService.js'

// Get all registrations
export const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find()
      .sort({ createdAt: -1 })
      .select('-__v')

    res.json({
      success: true,
      count: registrations.length,
      data: registrations
    })
  } catch (error) {
    console.error('Error fetching registrations:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching registrations'
    })
  }
}

// Get registration by ID
export const getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).select('-__v')

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
      message: 'Server error while fetching registration'
    })
  }
}

// Direct registration without payment
export const registerDirect = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('❌ Validation Failed:', JSON.stringify(errors.array(), null, 2))
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      })
    }

    const { name, email, phone, college, year } = req.body

    // Check if email already exists
    const existingRegistration = await Registration.findOne({ email: email.toLowerCase() })
    if (existingRegistration) {
      console.log(`⚠️ Duplicate registration attempt for email: ${email}`)
      return res.status(400).json({
        success: false,
        message: 'Email already registered for this event'
      })
    }

    // Create registration directly
    const registration = new Registration({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.replace(/\D/g, ''),
      college: college.trim(),
      year,
      paymentStatus: 'completed' // No payment required
    })

    await registration.save()
    console.log('✅ Direct registration completed:', registration._id)

    // Send confirmation email
    try {
      const emailResult = await sendConfirmationEmail(registration)
      if (emailResult.success) {
        console.log('✅ Confirmation email sent successfully')

        // Update registration with email details if available
        if (emailResult.ticketNumber) {
          registration.ticketNumber = emailResult.ticketNumber
          registration.qrCode = emailResult.qrCode
          registration.ticketGenerated = true
          registration.emailSentAt = new Date()
          await registration.save()
        }
      }
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError)
      // Don't fail the registration for email issues
    }

    res.json({
      success: true,
      message: 'Registration completed successfully',
      data: {
        id: registration._id,
        name: registration.name,
        email: registration.email,
        college: registration.college,
        year: registration.year,
        registrationDate: registration.registrationDate,
        paymentStatus: registration.paymentStatus
      }
    })

  } catch (error) {
    console.error('❌ Direct registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Update payment status (for admin use)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body

    if (!['pending', 'paid_awaiting_verification', 'verified', 'completed', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      })
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true, runValidators: true }
    ).select('-__v')

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      })
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: registration
    })
  } catch (error) {
    console.error('Error updating payment status:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment status'
    })
  }
}

// Check email status for pending payments (Option 3)
export const checkEmailStatus = async (req, res) => {
  try {
    const { email } = req.query

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      })
    }

    const registration = await Registration.findOne({
      email: email.toLowerCase()
    }).select('-__v -paymentScreenshot')

    if (!registration) {
      return res.json({
        success: true,
        exists: false,
        message: 'Email not found'
      })
    }

    // Return different responses based on payment status
    if (registration.paymentStatus === 'pending') {
      return res.json({
        success: true,
        exists: true,
        hasPendingPayment: true,
        message: 'Email has pending payment',
        data: {
          id: registration._id,
          name: registration.name,
          email: registration.email,
          college: registration.college,
          year: registration.year,
          paymentStatus: registration.paymentStatus,
          amount: registration.amount,
          createdAt: registration.createdAt
        }
      })
    } else if (registration.paymentStatus === 'paid_awaiting_verification') {
      return res.json({
        success: true,
        exists: true,
        hasPendingPayment: false,
        message: 'Payment submitted, awaiting verification',
        data: {
          paymentStatus: registration.paymentStatus
        }
      })
    } else {
      return res.json({
        success: true,
        exists: true,
        hasPendingPayment: false,
        message: 'Email already registered',
        data: {
          paymentStatus: registration.paymentStatus
        }
      })
    }

  } catch (error) {
    console.error('❌ Email check error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while checking email'
    })
  }
}

// Create registration (new UPI flow)
export const createRegistration = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('❌ Validation Failed:', JSON.stringify(errors.array(), null, 2))
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      })
    }

    const { name, email, phone, college, year, isGroupBooking, ticketQuantity, totalAmount, groupMembers } = req.body

    // Check if email already exists (check both primary and group members)
    const existingRegistration = await Registration.findOne({ email: email.toLowerCase() })
    if (existingRegistration) {
      console.log(`⚠️ Duplicate registration attempt for email: ${email}`)
      return res.status(400).json({
        success: false,
        message: 'Email already registered for this event'
      })
    }

    // Check for duplicate emails in group members
    if (isGroupBooking && groupMembers && groupMembers.length > 0) {
      const allEmails = [email.toLowerCase(), ...groupMembers.map(member => member.email.toLowerCase())]
      const uniqueEmails = [...new Set(allEmails)]
      
      if (allEmails.length !== uniqueEmails.length) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate email addresses found in the group'
        })
      }

      // Check if any group member email already exists in database
      for (const memberEmail of groupMembers.map(m => m.email.toLowerCase())) {
        const existingMember = await Registration.findOne({ email: memberEmail })
        if (existingMember) {
          return res.status(400).json({
            success: false,
            message: `Email ${memberEmail} is already registered for this event`
          })
        }
      }
    }

    // Create registration with pending payment
    const registration = new Registration({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.replace(/\D/g, ''),
      college: college.trim(),
      year,
      paymentStatus: 'pending',
      paymentMethod: 'upi',
      isGroupBooking: isGroupBooking || false,
      ticketQuantity: ticketQuantity || 1,
      totalAmount: totalAmount || 19900,
      amount: totalAmount || 19900,
      groupMembers: isGroupBooking ? groupMembers.map(member => ({
        name: member.name.trim(),
        email: member.email.trim().toLowerCase(),
        phone: member.phone.replace(/\D/g, ''),
        college: member.college.trim(),
        year: member.year
      })) : []
    })

    await registration.save()
    console.log('✅ Registration created (pending payment):', registration._id)

    res.json({
      success: true,
      message: `${isGroupBooking ? 'Group registration' : 'Registration'} created successfully. Please complete payment.`,
      data: {
        id: registration._id,
        name: registration.name,
        email: registration.email,
        college: registration.college,
        year: registration.year,
        registrationDate: registration.registrationDate,
        paymentStatus: registration.paymentStatus,
        isGroupBooking: registration.isGroupBooking,
        ticketQuantity: registration.ticketQuantity,
        totalAmount: registration.totalAmount,
        amount: registration.amount
      }
    })

  } catch (error) {
    console.error('❌ Registration creation error:', error)
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Submit payment details
export const submitPayment = async (req, res) => {
  try {
    const { registrationId, upiTransactionId, paymentScreenshot, paymentMethod = 'upi', amount } = req.body

    if (!registrationId || !upiTransactionId || !paymentScreenshot) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment details'
      })
    }

    const registration = await Registration.findById(registrationId)
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      })
    }

    if (registration.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been submitted for this registration'
      })
    }

    // Update registration with payment details
    registration.upiTransactionId = upiTransactionId.trim()
    registration.paymentScreenshot = paymentScreenshot
    registration.paymentMethod = paymentMethod
    registration.paymentStatus = 'paid_awaiting_verification'
    registration.paymentSubmittedAt = new Date()

    await registration.save()
    console.log('✅ Payment details submitted for verification:', registration._id)

    res.json({
      success: true,
      message: 'Payment details submitted successfully. Admin will verify and send your ticket.',
      data: {
        id: registration._id,
        name: registration.name,
        email: registration.email,
        college: registration.college,
        year: registration.year,
        paymentStatus: registration.paymentStatus,
        upiTransactionId: registration.upiTransactionId,
        paymentSubmittedAt: registration.paymentSubmittedAt,
        amount: registration.amount
      }
    })

  } catch (error) {
    console.error('❌ Payment submission error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit payment details. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Admin verify payment and send ticket
export const verifyPayment = async (req, res) => {
  try {
    const { approved, notes, rejectionReason } = req.body
    const registrationId = req.params.id

    const registration = await Registration.findById(registrationId)
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      })
    }

    if (registration.paymentStatus !== 'paid_awaiting_verification') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not awaiting verification'
      })
    }

    if (approved) {
      // Approve payment - mark as completed immediately
      registration.paymentStatus = 'completed'
      registration.adminVerifiedAt = new Date()
      registration.adminVerifiedBy = req.admin?.username || 'admin'
      registration.paymentNotes = notes || ''
      registration.paymentDate = new Date()

      await registration.save()

      // 🚀 Send ticket email in background (non-blocking)
      // This allows the admin to get an immediate response
      setImmediate(async () => {
        try {
          console.log(`📧 Sending ticket email in background for ${registration.email}...`)
          
          let emailResult
          if (registration.isGroupBooking) {
            console.log(`📧 Sending group confirmation emails for ${registration.ticketQuantity} tickets`)
            emailResult = await sendGroupConfirmationEmails(registration)
          } else {
            emailResult = await sendConfirmationEmail(registration)
          }

          if (emailResult.success) {
            console.log(`✅ Ticket email(s) sent successfully to ${registration.email}`)

            // Update registration with ticket details
            if (emailResult.ticketNumber || emailResult.primaryTicketNumber) {
              const updatedReg = await Registration.findById(registrationId)
              if (updatedReg) {
                updatedReg.ticketNumber = emailResult.ticketNumber || emailResult.primaryTicketNumber
                updatedReg.qrCode = emailResult.qrCode
                updatedReg.ticketGenerated = true
                updatedReg.emailSentAt = new Date()
                await updatedReg.save()
                console.log(`✅ Ticket details updated for ${registration.email}`)
              }
            }
          } else {
            console.error(`❌ Failed to send ticket email to ${registration.email}:`, emailResult.error)
          }
        } catch (emailError) {
          console.error(`❌ Background email error for ${registration.email}:`, emailError)
        }
      })

      // Return immediately without waiting for email
      res.json({
        success: true,
        message: 'Payment verified successfully. Ticket email is being sent in background.',
        data: registration
      })

    } else {
      // Reject payment
      registration.paymentStatus = 'failed'
      registration.adminVerifiedAt = new Date()
      registration.adminVerifiedBy = req.admin?.username || 'admin'
      registration.paymentRejectionReason = rejectionReason || 'Payment verification failed'
      registration.paymentNotes = notes || ''

      await registration.save()

      res.json({
        success: true,
        message: 'Payment verification rejected',
        data: registration
      })
    }

  } catch (error) {
    console.error('❌ Payment verification error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}