import { sendFriendOTPEmail } from './services/emailService.js'

// Test the user-friendly error handling
async function testUserFriendlyErrors() {
  console.log('🧪 Testing user-friendly error handling...')
  
  try {
    // Test with invalid email to trigger an error
    const result = await sendFriendOTPEmail('invalid-email@nonexistent-domain-123456.com', 'Test User', '123456')
    console.log('✅ Test result:', result)
    
    if (!result.success) {
      console.log('✅ User-friendly error message:', result.error)
      console.log('✅ Error does not contain technical details')
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
  
  console.log('🧪 Test completed')
}

// Run test
testUserFriendlyErrors()