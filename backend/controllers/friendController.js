import { validationResult } from 'express-validator'
import Registration from '../models/Registration.js'
import OTP from '../models/OTP.js'
import AdminSettings from '../models/AdminSettings.js'
import { sendFriendOTPEmail, sendFriendRegistrationConfirmation } from '../services/emailService.js'
import crypto from 'crypto'

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Check if friend offer is enabled
export const getFriendOfferStatus = async (req, res) => {
  try {
    const isEnabled = await AdminSettings.getSetting('friendOfferEnabled')
    const discountAmount = await AdminSettings.getSetting('friendDiscountAmount')

    res.json({
      success: true,
      data: {
        enabled: isEnabled ?? true,
        discountAmount: discountAmount ?? 10000,
        discountDisplay: `₹${(discountAmount ?? 10000) / 100}`,
        finalPrice: `₹${(19900 - (discountAmount ?? 10000)) / 100}`,
        originalPrice: '₹199'
      }
    })
  } catch (error) {
    console.error('Error checking friend offer status:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// Check eligibility to refer a friend
export const checkEligibility = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { identifier } = req.body

    // Check if friend offer is enabled
    const isOfferEnabled = await AdminSettings.getSetting('friendOfferEnabled')
    if (!isOfferEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Friend referral offer is currently disabled'
      })
    }

    // Find existing user by email or ticket number
    const existingUser = await Registration.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { ticketNumber: identifier }
      ]
    })

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please check your email or ticket number.'
      })
    }

    // Check eligibility criteria
    const eligibilityErrors = []

    if (existingUser.paymentStatus !== 'completed') {
      eligibilityErrors.push('Your payment must be completed to refer a friend')
    }

    if (existingUser.isGroupBooking) {
      eligibilityErrors.push('Group booking users cannot refer friends')
    }

    if (existingUser.isFriendReferral) {
      eligibilityErrors.push('Friend referrals cannot refer other friends')
    }

    if (existingUser.hasReferredFriend) {
      eligibilityErrors.push('You have already referred a friend')
    }

    if (eligibilityErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User not eligible for friend referral',
        errors: eligibilityErrors
      })
    }

    res.json({
      success: true,
      message: 'User is eligible for friend referral',
      data: {
        userId: existingUser._id,
        userEmail: existingUser.email,
        userName: existingUser.name
      }
    })

  } catch (error) {
    console.error('Error checking eligibility:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while checking eligibility'
    })
  }
}

// Verify existing user and send OTP
export const verifyExistingUser = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { identifier } = req.body

    // Check if friend offer is enabled
    const isOfferEnabled = await AdminSettings.getSetting('friendOfferEnabled')
    if (!isOfferEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Friend referral offer is currently disabled'
      })
    }

    // Find existing user
    const existingUser = await Registration.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { ticketNumber: identifier }
      ]
    })

    if (!existingUser || 
        existingUser.paymentStatus !== 'completed' || 
        existingUser.isGroupBooking || 
        existingUser.isFriendReferral || 
        existingUser.hasReferredFriend) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not eligible for friend referral'
      })
    }

    // Check rate limiting - max 3 OTP requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentOTPs = await OTP.countDocuments({
      email: existingUser.email,
      purpose: 'friend_invitation',
      createdAt: { $gte: oneHourAgo }
    })

    if (recentOTPs >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again after an hour.'
      })
    }

    // Generate and save OTP
    const otp = generateOTP()
    
    console.log('📧 Generating OTP for friend referral...')
    console.log(`User: ${existingUser.name} (${existingUser.email})`)
    console.log(`OTP: ${otp}`)
    
    await OTP.create({
      email: existingUser.email,
      otp,
      purpose: 'friend_invitation'
    })

    console.log('✅ OTP saved to database')

    // Send OTP email
    try {
      console.log('📤 Attempting to send OTP email...')
      const emailResult = await sendFriendOTPEmail(existingUser.email, existingUser.name, otp)
      
      if (!emailResult.success) {
        console.error('❌ Email sending failed:', emailResult.error)
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP email: ' + emailResult.error
        })
      }
      
      console.log('✅ OTP email sent successfully:', emailResult.messageId)
    } catch (emailError) {
      console.error('❌ Error sending OTP email:', emailError)
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email: ' + emailError.message
      })
    }

    res.json({
      success: true,
      message: 'OTP sent successfully to your registered email',
      data: {
        userEmail: existingUser.email,
        userName: existingUser.name
      }
    })

  } catch (error) {
    console.error('Error verifying existing user:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while sending OTP'
    })
  }
}

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { email, otp } = req.body

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'friend_invitation',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    })

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      })
    }

    // Check attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum OTP verification attempts reached'
      })
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      otpRecord.attempts += 1
      await otpRecord.save()

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        attemptsRemaining: otpRecord.maxAttempts - otpRecord.attempts
      })
    }

    // Mark OTP as used
    otpRecord.isUsed = true
    otpRecord.usedAt = new Date()
    await otpRecord.save()

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        userEmail: email
      }
    })

  } catch (error) {
    console.error('Error verifying OTP:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while verifying OTP'
    })
  }
}

// Register friend with discount
export const registerFriend = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.error('❌ Validation errors:', errors.array())
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { referrerEmail, friend } = req.body

    console.log('📝 Friend registration request:', {
      referrerEmail,
      friendName: friend?.name,
      friendEmail: friend?.email
    })

    // Validate friend object structure
    if (!friend || typeof friend !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Friend details are required'
      })
    }

    // Security Check: Ensure OTP was verified recently (e.g., within 15 mins)
    // This prevents bypassing the OTP step by calling this endpoint directly
    const recentVerifiedOTP = await OTP.findOne({
      email: referrerEmail.toLowerCase(),
      purpose: 'friend_invitation',
      isUsed: true,
      usedAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
    })

    if (!recentVerifiedOTP) {
      return res.status(403).json({
        success: false,
        message: 'Session expired or unauthorized. Please verify OTP again.'
      })
    }

    // Verify referrer exists and is eligible
    const referrer = await Registration.findOne({
      email: referrerEmail.toLowerCase()
    })

    if (!referrer || 
        referrer.paymentStatus !== 'completed' || 
        referrer.isGroupBooking || 
        referrer.isFriendReferral || 
        referrer.hasReferredFriend) {
      return res.status(400).json({
        success: false,
        message: 'Referrer not found or not eligible'
      })
    }

    // Check if friend already has any registration (any status)
    const existingFriend = await Registration.findOne({
      email: friend.email.toLowerCase().trim()
    })

    if (existingFriend) {
      let message = 'This person is already registered for this event'
      if (existingFriend.paymentStatus === 'pending') {
        message = 'This person already has a pending registration. Please complete that payment first.'
      } else if (existingFriend.paymentStatus === 'completed') {
        message = 'This person is already registered with completed payment'
      }
      return res.status(400).json({
        success: false,
        message: message
      })
    }

    // Get offer settings
    const discountAmount = await AdminSettings.getSetting('friendDiscountAmount') ?? 10000
    
    // Calculate amounts
    const originalAmount = 19900 // ₹199
    const finalAmount = originalAmount - discountAmount // ₹199 - ₹100 = ₹99

    // Create friend registration with try-catch for duplicate key errors
    let friendRegistration
    try {
      friendRegistration = new Registration({
        name: friend.name.trim(),
        email: friend.email.toLowerCase().trim(),
        phone: friend.phone.replace(/\D/g, ''),
        college: friend.college.trim(),
        year: friend.year,
        amount: finalAmount,
        totalAmount: finalAmount,
        originalAmount: originalAmount,
        friendDiscountApplied: discountAmount,
        isFriendReferral: true,
        referredBy: referrer._id,
        paymentStatus: 'pending'
      })

      await friendRegistration.save()
      console.log('✅ Friend registration created successfully:', friendRegistration._id)
    } catch (saveError) {
      console.error('❌ Error saving friend registration:', saveError)
      if (saveError.code === 11000) {
        // Handle duplicate email error specifically
        return res.status(400).json({
          success: false,
          message: 'This email is already registered. Please use a different email address.'
        })
      }
      throw saveError // Re-throw if it's not a duplicate key error
    }

    // Add friend to referrer's list (but don't mark as referred until payment is verified)
    referrer.friendsReferred.push(friendRegistration._id)
    await referrer.save()

    // Send confirmation email
    try {
      await sendFriendRegistrationConfirmation(
        friend.email, 
        friend.name, 
        referrer.name,
        discountAmount / 100
      )
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    res.json({
      success: true,
      message: 'Friend registration created successfully',
      data: {
        registrationId: friendRegistration._id,
        amount: finalAmount,
        discountAmount: discountAmount,
        originalAmount: originalAmount,
        amountDisplay: `₹${finalAmount / 100}`,
        discountDisplay: `₹${discountAmount / 100}`,
        originalDisplay: `₹${originalAmount / 100}`
      }
    })

  } catch (error) {
    console.error('❌ Error registering friend:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    })
    
    // More specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid friend data provided',
        details: Object.keys(error.errors).map(key => error.errors[key].message)
      })
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid referrer information'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while registering friend. Please try again.'
    })
  }
}