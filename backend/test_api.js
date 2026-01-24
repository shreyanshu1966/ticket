import fetch from 'node-fetch';

// Test the verify ticket API endpoint
async function testVerifyAPI() {
  try {
    console.log('🧪 Testing Ticket Verification API');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const baseURL = 'http://localhost:5000/api/tickets';
    
    // Test 1: Valid group member QR data
    const validQRData = JSON.stringify({
      ticketNumber: "ACD2026-061476944",
      registrationId: "697488a747c097a064a5b457",
      name: "dfdf",
      email: "shreyanshumaske1966@gmail.com", 
      eventCode: "ACD-2026",
      generatedAt: new Date().toISOString()
    });

    console.log('\n🎟️ Test 1: Valid Group Member Ticket');
    console.log('QR Data:', validQRData);
    
    const response1 = await fetch(`${baseURL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ qrData: validQRData })
    });
    
    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(result1, null, 2));
    
    // Test 2: If verification was successful, test entry confirmation
    if (result1.success && result1.data) {
      console.log('\n✅ Test 2: Entry Confirmation');
      const confirmResponse = await fetch(`${baseURL}/confirm-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registrationId: result1.data.registrationId,
          ticketNumber: result1.data.ticketNumber,
          isGroupMember: result1.data.isGroupMember,
          groupMemberId: result1.data.groupMemberId
        })
      });
      
      const confirmResult = await confirmResponse.json();
      console.log('Confirmation Status:', confirmResponse.status);
      console.log('Confirmation Response:', JSON.stringify(confirmResult, null, 2));
      
      // Test 3: Duplicate scan detection
      console.log('\n⚠️ Test 3: Duplicate Scan Detection');
      const duplicateResponse = await fetch(`${baseURL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qrData: validQRData })
      });
      
      const duplicateResult = await duplicateResponse.json();
      console.log('Duplicate Status:', duplicateResponse.status);
      console.log('Duplicate Response:', JSON.stringify(duplicateResult, null, 2));
    }
    
    // Test 4: Test attendance stats
    console.log('\n📊 Test 4: Attendance Statistics');
    const statsResponse = await fetch(`${baseURL}/attendance-stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const statsResult = await statsResponse.json();
    console.log('Stats Status:', statsResponse.status);
    console.log('Stats Response:', JSON.stringify(statsResult, null, 2));
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.log('\nℹ️ Make sure the backend server is running on port 3001');
  }
}

testVerifyAPI();