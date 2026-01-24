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
      ],
      paymentStatus: 'completed',
      isGroupBooking: false,
      isFriendReferral: false,
      hasReferredFriend: false
    })

    if (!existingUser) {
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
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { referrerEmail, friend } = req.body

    // Verify referrer exists and is eligible
    const referrer = await Registration.findOne({
      email: referrerEmail.toLowerCase(),
      paymentStatus: 'completed',
      isGroupBooking: false,
      isFriendReferral: false,
      hasReferredFriend: false
    })

    if (!referrer) {
      return res.status(400).json({
        success: false,
        message: 'Referrer not found or not eligible'
      })
    }

    // Check if friend already has completed registration
    const existingFriend = await Registration.findOne({
      email: friend.email.toLowerCase(),
      paymentStatus: 'completed'
    })

    if (existingFriend) {
      return res.status(400).json({
        success: false,
        message: 'This person is already registered with completed payment'
      })
    }

    // Get offer settings
    const discountAmount = await AdminSettings.getSetting('friendDiscountAmount') ?? 10000
    
    // Calculate amounts
    const originalAmount = 19900 // ₹199
    const finalAmount = originalAmount - discountAmount // ₹199 - ₹100 = ₹99

    // Create friend registration
    const friendRegistration = new Registration({
      name: friend.name,
      email: friend.email.toLowerCase(),
      phone: friend.phone,
      college: friend.college,
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

    // Update referrer
    referrer.hasReferredFriend = true
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
    console.error('Error registering friend:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while registering friend'
    })
  }
}