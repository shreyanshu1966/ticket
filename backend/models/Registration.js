import mongoose from 'mongoose'

const registrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    minlength: [10, 'Phone number must be at least 10 digits']
  },
  college: {
    type: String,
    required: [true, 'College is required'],
    trim: true,
    minlength: [2, 'College name must be at least 2 characters']
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate', 'PhD', 'Alumni', 'Faculty', 'Other']
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid_awaiting_verification', 'verified', 'completed', 'failed', 'verification_failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'razorpay', 'direct'],
    default: 'upi'
  },
  upiTransactionId: {
    type: String,
    trim: true
  },
  paymentScreenshot: {
    type: String, // Base64 encoded image or file path
    trim: true
  },
  paymentSubmittedAt: {
    type: Date
  },
  adminVerifiedAt: {
    type: Date
  },
  adminVerifiedBy: {
    type: String,
    trim: true
  },
  paymentNotes: {
    type: String,
    trim: true
  },
  paymentRejectionReason: {
    type: String,
    trim: true
  },
  paymentId: {
    type: String
  },
  orderId: {
    type: String
  },
  paymentDate: {
    type: Date
  },
  verificationTime: {
    type: Number // Time taken for verification in ms
  },
  verificationError: {
    type: String
  },
  emailSentAt: {
    type: Date
  },
  ticketGenerated: {
    type: Boolean,
    default: false
  },
  amount: {
    type: Number,
    default: 19900 // Amount in paise (₹199 = 19900 paise)
  },
  ticketNumber: {
    type: String,
    unique: true,
    sparse: true  // Allow multiple null values, only enforce uniqueness for non-null values
  },
  qrCode: {
    type: String
  },
  isScanned: {
    type: Boolean,
    default: false
  },
  scannedAt: {
    type: Date
  },
  entryConfirmed: {
    type: Boolean,
    default: false
  },
  resendCount: {
    type: Number,
    default: 0
  },
  lastResentAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Create indexes for better query performance
registrationSchema.index({ paymentStatus: 1, createdAt: -1 })
registrationSchema.index({ year: 1, createdAt: -1 })
registrationSchema.index({ email: 1 })
registrationSchema.index({ name: 'text', email: 'text', college: 'text' })
registrationSchema.index({ createdAt: -1 })

const Registration = mongoose.model('Registration', registrationSchema)

export default Registration