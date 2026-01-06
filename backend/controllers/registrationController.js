import { validationResult } from 'express-validator'
import Registration from '../models/Registration.js'
import razorpay from '../config/razorpay.js'
import crypto from 'crypto'
import { sendConfirmationEmail } from '../services/emailService.js'

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

// Create Razorpay order
export const createOrder = async (req, res) => {
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
    const existingRegistration = await Registration.findOne({ email })
    if (existingRegistration) {
      console.log(`⚠️ Duplicate registration attempt for email: ${email}`)
      return res.status(400).json({
        success: false,
        message: 'Email already registered for this event'
      })
    }

    // Validate Razorpay credentials before making API call
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_default') {
      console.error('❌ RAZORPAY_KEY_ID is not configured in .env file')
      return res.status(500).json({
        success: false,
        message: 'Payment system is not configured. Please contact support.',
        error: 'RAZORPAY_NOT_CONFIGURED'
      })
    }

    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === 'default_secret') {
      console.error('❌ RAZORPAY_KEY_SECRET is not configured in .env file')
      return res.status(500).json({
        success: false,
        message: 'Payment system is not configured. Please contact support.',
        error: 'RAZORPAY_NOT_CONFIGURED'
      })
    }

    // Create Razorpay order
    const options = {
      amount: 19900, // Amount in paise (₹199 = 19900 paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        name,
        email,
        phone,
        college,
        year
      }
    }

    console.log('📝 Creating Razorpay order with options:', { ...options, notes: { email } })

    let order
    try {
      order = await razorpay.orders.create(options)
      console.log('✅ Razorpay order created successfully:', order.id)
    } catch (razorpayError) {
      console.error('❌ Razorpay API Error:', {
        message: razorpayError.message,
        statusCode: razorpayError.statusCode,
        error: razorpayError.error
      })

      // Handle specific Razorpay errors
      if (razorpayError.statusCode === 401 || razorpayError.statusCode === 400) {
        return res.status(500).json({
          success: false,
          message: 'Payment gateway authentication failed. Please contact support.',
          error: 'RAZORPAY_AUTH_ERROR',
          details: process.env.NODE_ENV === 'development' ? razorpayError.message : undefined
        })
      }

      if (razorpayError.message && razorpayError.message.includes('ENOTFOUND')) {
        return res.status(500).json({
          success: false,
          message: 'Unable to connect to payment gateway. Please check your internet connection.',
          error: 'RAZORPAY_CONNECTION_ERROR'
        })
      }

      throw razorpayError
    }

    // Create registration with pending payment
    const registration = new Registration({
      name,
      email,
      phone,
      college,
      year,
      razorpayOrderId: order.id,
      paymentStatus: 'pending'
    })

    await registration.save()
    console.log('✅ Registration created with ID:', registration._id)

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      registrationId: registration._id
    })

  } catch (error) {
    console.error('❌ Error creating order:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
    res.status(500).json({
      success: false,
      message: 'Error creating payment order. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Verify payment with Razorpay API double-check
const verifyWithRazorpayAPI = async (paymentId) => {
  try {
    console.log(`🔍 Double-checking payment ${paymentId} with Razorpay API...`)
    const payment = await razorpay.payments.fetch(paymentId)

    console.log('Razorpay API payment status:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      captured: payment.captured
    })

    return payment.status === 'captured' || payment.status === 'authorized'
  } catch (error) {
    console.error('Error fetching payment from Razorpay API:', error)
    return false
  }
}

// Verify payment
export const verifyPayment = async (req, res) => {
  let registration = null
  const startTime = Date.now()

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = req.body

    console.log('🔒 Starting payment verification process:', {
      razorpay_order_id,
      razorpay_payment_id,
      registrationId,
      timestamp: new Date().toISOString()
    })

    // Input validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !registrationId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters'
      })
    }

    // Find registration first
    registration = await Registration.findById(registrationId)
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      })
    }

    // Check if payment is already verified
    if (registration.paymentStatus === 'completed' && registration.paymentId === razorpay_payment_id) {
      console.log('⚠️ Payment already verified for this registration')
      
      // If ticket wasn't generated for some reason, try to generate it
      if (!registration.ticketGenerated) {
        console.log('📧 Payment verified but no ticket generated, attempting to send ticket...')
        try {
          const emailResult = await sendConfirmationEmail(registration)
          if (emailResult.success) {
            registration.ticketNumber = emailResult.ticketNumber
            registration.qrCode = emailResult.qrCode
            registration.ticketGenerated = true
            registration.emailSentAt = new Date()
            await registration.save()
            console.log('✅ Ticket sent successfully on duplicate verification attempt')
          }
        } catch (emailError) {
          console.error('❌ Email failed on duplicate verification attempt:', emailError)
        }
      }
      
      return res.json({
        success: true,
        message: 'Payment already verified',
        data: {
          id: registration._id,
          name: registration.name,
          email: registration.email,
          phone: registration.phone,
          college: registration.college,
          year: registration.year,
          paymentStatus: registration.paymentStatus,
          amount: registration.amount,
          ticketGenerated: registration.ticketGenerated || false,
          ticketNumber: registration.ticketNumber
        }
      })
    }
    
    // Check if this payment ID is already used by another registration
    const existingPayment = await Registration.findOne({ 
      paymentId: razorpay_payment_id,
      _id: { $ne: registrationId }
    })
    
    if (existingPayment) {
      console.log('❌ Payment ID already used by another registration:', existingPayment._id)
      return res.status(400).json({
        success: false,
        message: 'This payment has already been used for another registration'
      })
    }

    // Step 1: Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    const signatureValid = expectedSignature === razorpay_signature
    console.log('🔐 Signature verification:', {
      expected: expectedSignature,
      received: razorpay_signature,
      isValid: signatureValid
    })

    if (!signatureValid) {
      console.log('❌ Payment signature verification failed')
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed'
      })
    }

    // Step 2: Double-check with Razorpay API
    const razorpayApiValid = await verifyWithRazorpayAPI(razorpay_payment_id)
    if (!razorpayApiValid) {
      console.log('❌ Razorpay API verification failed')
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - payment not captured'
      })
    }

    // Step 3: Update registration with payment details (with atomic operation to prevent race conditions)
    console.log('📝 Updating registration with payment details...')
    
    // Use findByIdAndUpdate with specific conditions to ensure atomicity
    const updatedRegistration = await Registration.findOneAndUpdate(
      { 
        _id: registrationId,
        paymentStatus: { $ne: 'completed' }, // Only update if not already completed
        $or: [
          { paymentId: { $exists: false } },
          { paymentId: null },
          { paymentId: razorpay_payment_id }
        ]
      },
      {
        paymentStatus: 'completed',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        paymentDate: new Date(),
        verificationTime: Date.now() - startTime
      },
      {
        new: true,
        runValidators: true
      }
    )
    
    if (!updatedRegistration) {
      console.log('⚠️ Registration was already processed by another request')
      // Try to find the registration to return its current state
      const currentRegistration = await Registration.findById(registrationId)
      if (currentRegistration && currentRegistration.paymentStatus === 'completed') {
        return res.json({
          success: true,
          message: 'Payment already processed',
          data: {
            id: currentRegistration._id,
            name: currentRegistration.name,
            email: currentRegistration.email,
            phone: currentRegistration.phone,
            college: currentRegistration.college,
            year: currentRegistration.year,
            paymentStatus: currentRegistration.paymentStatus,
            amount: currentRegistration.amount,
            ticketGenerated: currentRegistration.ticketGenerated || false,
            ticketNumber: currentRegistration.ticketNumber
          }
        })
      } else {
        return res.status(409).json({
          success: false,
          message: 'Payment verification conflict. Please try again.'
        })
      }
    }
    
    registration = updatedRegistration
    console.log('✅ Registration updated with payment details')

    // Step 4: Send email only if verification is completely successful and email hasn't been sent
    let emailResult = { success: false }
    
    // Only send email if ticket hasn't been generated yet
    if (!registration.ticketGenerated) {
      try {
        console.log('📧 Starting email sending process...')
        emailResult = await sendConfirmationEmail(registration)

        if (emailResult.success && !emailResult.alreadySent) {
          // Use atomic update to prevent race condition in ticket generation
          const ticketUpdate = await Registration.findOneAndUpdate(
            {
              _id: registration._id,
              ticketGenerated: { $ne: true } // Only update if ticket not already generated
            },
            {
              ticketNumber: emailResult.ticketNumber,
              qrCode: emailResult.qrCode,
              ticketGenerated: true,
              emailSentAt: new Date()
            },
            {
              new: true,
              runValidators: true
            }
          )
          
          if (ticketUpdate) {
            registration = ticketUpdate
            console.log('✅ Ticket generated and email sent successfully')
          } else {
            console.log('⚠️ Ticket was already generated by another process')
          }
        } else if (emailResult.alreadySent) {
          console.log('ℹ️ Email was already sent previously')
        } else {
          console.log('⚠️ Email failed but payment verified - user can contact support')
        }
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError)
        // Don't fail the verification if email fails
      }
    } else {
      console.log('ℹ️ Ticket already generated for this registration')
      emailResult.success = true // Consider it successful since ticket exists
    }

    const verificationTime = Date.now() - startTime
    console.log(`⏱️ Total verification time: ${verificationTime}ms`)

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        id: registration._id,
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        college: registration.college,
        year: registration.year,
        paymentStatus: registration.paymentStatus,
        amount: registration.amount,
        ticketGenerated: registration.ticketGenerated || false,
        ticketNumber: registration.ticketNumber,
        emailSent: emailResult.success,
        verificationTime: verificationTime
      }
    })

  } catch (error) {
    console.error('❌ Payment verification error:', error)

    // If registration was found but verification failed, mark as failed
    if (registration && registration.paymentStatus !== 'completed') {
      try {
        registration.paymentStatus = 'verification_failed'
        registration.verificationError = error.message
        await registration.save()
      } catch (saveError) {
        console.error('Error updating registration with failure:', saveError)
      }
    }

    res.status(500).json({
      success: false,
      message: 'Payment verification failed: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body

    if (!['pending', 'completed', 'failed'].includes(paymentStatus)) {
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

// Check verification status and resend email if needed
export const checkVerificationStatus = async (req, res) => {
  try {
    const { registrationId, paymentId } = req.body

    if (!registrationId && !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID or Payment ID is required'
      })
    }

    // Find registration by ID or payment ID
    let registration
    if (registrationId) {
      registration = await Registration.findById(registrationId)
    } else if (paymentId) {
      registration = await Registration.findOne({ paymentId: paymentId })
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      })
    }

    console.log(`🔍 Checking verification status for registration ${registration._id}:`, {
      paymentStatus: registration.paymentStatus,
      ticketGenerated: registration.ticketGenerated,
      emailSentAt: registration.emailSentAt
    })

    // If payment is verified but email not sent, try to send it
    if (registration.paymentStatus === 'completed' && !registration.ticketGenerated) {
      console.log('📧 Payment verified but email not sent. Attempting to send...')

      try {
        const emailResult = await sendConfirmationEmail(registration)

        if (emailResult.success && !emailResult.alreadySent) {
          // Use atomic update to prevent race condition
          const ticketUpdate = await Registration.findOneAndUpdate(
            {
              _id: registration._id,
              ticketGenerated: { $ne: true }
            },
            {
              ticketNumber: emailResult.ticketNumber,
              qrCode: emailResult.qrCode,
              ticketGenerated: true,
              emailSentAt: new Date()
            },
            {
              new: true,
              runValidators: true
            }
          )
          
          if (ticketUpdate) {
            registration = ticketUpdate
            console.log('✅ Email sent successfully on retry')
          } else {
            console.log('ℹ️ Ticket was already generated by another process')
          }
        } else if (emailResult.alreadySent) {
          console.log('ℹ️ Email was already sent')
        } else {
          console.log('❌ Email failed on retry')
        }

        return res.json({
          success: true,
          message: emailResult.success || emailResult.alreadySent ? 'Email sent successfully' : 'Email failed but payment is verified',
          data: {
            id: registration._id,
            paymentStatus: registration.paymentStatus,
            ticketGenerated: registration.ticketGenerated,
            emailSent: emailResult.success || emailResult.alreadySent,
            ticketNumber: registration.ticketNumber
          }
        })
      } catch (emailError) {
        console.error('Email retry error:', emailError)
        return res.status(500).json({
          success: false,
          message: 'Failed to send email, but payment is verified. Please contact support.',
          data: {
            id: registration._id,
            paymentStatus: registration.paymentStatus,
            paymentId: registration.paymentId
          }
        })
      }
    }

    // Return current status
    res.json({
      success: true,
      message: 'Verification status retrieved',
      data: {
        id: registration._id,
        name: registration.name,
        email: registration.email,
        paymentStatus: registration.paymentStatus,
        paymentId: registration.paymentId,
        ticketGenerated: registration.ticketGenerated || false,
        ticketNumber: registration.ticketNumber,
        emailSent: !!registration.emailSentAt,
        emailSentAt: registration.emailSentAt,
        verificationTime: registration.verificationTime
      }
    })

  } catch (error) {
    console.error('Error checking verification status:', error)
    res.status(500).json({
      success: false,
      message: 'Error checking verification status'
    })
  }
}

// Legacy register endpoint (redirect to payment flow)
export const registerDirect = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Please use the payment flow. Use /api/create-order instead.'
  })
}