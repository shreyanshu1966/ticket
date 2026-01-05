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
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'Post Graduate']
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'verification_failed'],
    default: 'pending'
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
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
    default: 199
  },
  ticketNumber: {
    type: String,
    unique: true
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
  }
}, {
  timestamps: true
})

const Registration = mongoose.model('Registration', registrationSchema)

export default Registration