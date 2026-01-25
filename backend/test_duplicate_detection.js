// Test duplicate entry detection for multi-day events
// This script helps test if duplicate tickets show proper information

const testDuplicateEntry = async () => {
  const baseUrl = 'http://localhost:5000/api'

  console.log('🧪 Testing Duplicate Entry Detection...')
  console.log('==========================================')

  // Test QR data - replace with actual ticket data
  const testQRData = 'REG_67608c2e8e8cf7d3b8a52ac7_T001001'
  const eventDay = 1

  try {
    console.log('\n1️⃣ First verification (should succeed):')
    let response = await fetch(`${baseUrl}/tickets/verify-multi-day`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData: testQRData, eventDay })
    })
    
    let result = await response.json()
    console.log('Response:', JSON.stringify(result, null, 2))

    if (result.success) {
      console.log('\n2️⃣ Confirming entry:')
      const confirmResponse = await fetch(`${baseUrl}/tickets/confirm-entry-multi-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          qrData: testQRData, 
          eventDay,
          verificationData: result.data 
        })
      })
      
      const confirmResult = await confirmResponse.json()
      console.log('Confirm Response:', JSON.stringify(confirmResult, null, 2))

      console.log('\n3️⃣ Second verification (should show duplicate):')
      response = await fetch(`${baseUrl}/tickets/verify-multi-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: testQRData, eventDay })
      })
      
      result = await response.json()
      console.log('Duplicate Response:', JSON.stringify(result, null, 2))

      if (result.error === 'DUPLICATE_DAY_ENTRY') {
        console.log('\n✅ DUPLICATE DETECTION WORKING!')
        console.log('📋 Attendee Details Available:')
        console.log(`   Name: ${result.data?.attendeeName || 'Missing'}`)
        console.log(`   Email: ${result.data?.attendeeEmail || 'Missing'}`)
        console.log(`   College: ${result.data?.attendeeCollege || 'Missing'}`)
        console.log(`   Year: ${result.data?.attendeeYear || 'Missing'}`)
        console.log(`   Ticket: ${result.data?.ticketNumber || 'Missing'}`)
        console.log(`   Entry Time: ${result.data?.entryDateFormatted || 'Missing'}`)
      } else {
        console.log('❌ Duplicate detection not working as expected')
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('\n💡 Make sure:')
    console.log('   • Backend server is running on port 5000')
    console.log('   • Replace testQRData with valid ticket QR data')
    console.log('   • Database is connected and has test data')
  }
}

// Run the test
testDuplicateEntry()