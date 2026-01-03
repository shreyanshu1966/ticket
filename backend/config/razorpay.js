import Razorpay from 'razorpay'
import dotenv from 'dotenv'

// Load environment variables if not already loaded
if (!process.env.RAZORPAY_KEY_ID) {
  dotenv.config()
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_default',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'default_secret'
})

export default razorpay