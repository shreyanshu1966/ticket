import mongoose from 'mongoose'
import dotenv from 'dotenv'

// Load environment variables if not already loaded
if (!process.env.MONGODB_URI) {
  dotenv.config()
}

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventregistration'
    await mongoose.connect(mongoURI)
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
    process.exit(1)
  }
}

export default connectDB