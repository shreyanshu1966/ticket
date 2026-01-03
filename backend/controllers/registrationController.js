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
      return res.status(400).json({
        success: false,
        message: 'Email already registered for this event'
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

    const order = await razorpay.orders.create(options)

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

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      registrationId: registration._id
    })

  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating payment order'
    })
  }
}

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = req.body

    console.log('Payment verification request:', {
      razorpay_order_id,
      razorpay_payment_id,
      registrationId
    })

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    console.log('Signature verification:', {
      expected: expectedSignature,
      received: razorpay_signature,
      isValid: expectedSignature === razorpay_signature
    })

    if (expectedSignature !== razorpay_signature) {
      console.log('❌ Payment signature verification failed')
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      })
    }

    // Find registration
    const registration = await Registration.findById(registrationId)
    if (!registration) {
      return res.status(404).json({ 
        success: false, 
        message: 'Registration not found' 
      })
    }

    // Update registration with payment details
    registration.paymentStatus = 'completed'
    registration.paymentId = razorpay_payment_id
    registration.orderId = razorpay_order_id
    registration.paymentDate = new Date()
    
    await registration.save()
    console.log('✅ Registration updated with payment details')

    // Send confirmation email with ticket
    try {
      const emailResult = await sendConfirmationEmail(registration)
      
      if (emailResult.success) {
        // Update registration with ticket information
        registration.ticketNumber = emailResult.ticketNumber
        registration.qrCode = emailResult.qrCode
        registration.ticketGenerated = true
        await registration.save()
        
        console.log('✅ Ticket generated and email sent')
      } else {
        console.log('⚠️ Email failed but payment verified')
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError)
    }

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
        ticketNumber: registration.ticketNumber
      }
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
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

// Legacy register endpoint (redirect to payment flow)
export const registerDirect = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Please use the payment flow. Use /api/create-order instead.'
  })
}