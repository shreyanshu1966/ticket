import Registration from '../models/Registration.js'
import { validationResult } from 'express-validator'
import { sendBulkNotification as sendBulkEmail } from '../services/emailService.js'

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
    
    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0
    
    res.json({
      success: true,
      data: {
        totalRegistrations,
        completedPayments,
        pendingPayments,
        failedPayments,
        totalRevenue: revenue,
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
    
    // Get registrations
    const registrations = await Registration.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
    
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
      .select('name email phone college year paymentStatus amount razorpayPaymentId createdAt')
    
    // Convert to CSV format data
    const csvData = registrations.map(reg => ({
      Name: reg.name,
      Email: reg.email,
      Phone: reg.phone,
      College: reg.college,
      Year: reg.year,
      'Payment Status': reg.paymentStatus,
      Amount: reg.amount,
      'Payment ID': reg.razorpayPaymentId || 'N/A',
      'Registration Date': reg.createdAt.toLocaleDateString()
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
    
    const registrations = await Registration.find(filter).select('name email')
    
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
    
    // Send bulk notification using email service
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