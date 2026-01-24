import fetch from 'node-fetch'

const API_BASE = 'http://localhost:5000'

// Test friend referral API endpoints
async function testFriendAPI() {
  console.log('🧪 Testing Friend Referral API Endpoints...\n')

  try {
    // Test 1: Check admin friend offer status
    console.log('1. Testing admin friend offer status...')
    const statusResponse = await fetch(`${API_BASE}/api/admin/friend-offer-status`)
    const statusData = await statusResponse.json()
    console.log('✅ Friend offer status:', statusData)

    // Test 2: Test verify existing user endpoint
    console.log('\n2. Testing verify existing user endpoint...')
    const verifyResponse = await fetch(`${API_BASE}/api/friend/verify-existing-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrTicket: 'test@example.com'
      })
    })
    const verifyData = await verifyResponse.json()
    console.log('Response status:', verifyResponse.status)
    console.log('Response:', verifyData)

    // Test 3: Check eligibility endpoint
    console.log('\n3. Testing check eligibility endpoint...')
    const eligibilityResponse = await fetch(`${API_BASE}/api/friend/check-eligibility?emailOrTicket=test@example.com`)
    const eligibilityData = await eligibilityResponse.json()
    console.log('Eligibility check:', eligibilityData)

    console.log('\n✅ All API endpoints are responding!')

  } catch (error) {
    console.error('❌ Error testing API:', error.message)
  }
}

testFriendAPI()