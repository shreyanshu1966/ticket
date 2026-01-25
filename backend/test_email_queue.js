import { sendFriendOTPEmail } from './services/emailService.js'

// Test the queued email system
async function testQueuedOTPEmail() {
  console.log('🧪 Testing queued OTP email sending...')
  
  try {
    const result = await sendFriendOTPEmail('test@example.com', 'Test User', '123456')
    console.log('✅ Test result:', result)
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
  
  console.log('🧪 Test completed')
}

// Run test
testQueuedOTPEmail()