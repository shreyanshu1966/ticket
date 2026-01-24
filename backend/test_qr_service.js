import { verifyQRCode } from './services/ticketService.js';

// Test QR code verification service
console.log('🧪 Testing QR Code Verification Service');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Test valid QR data for group member (with proper format)
const validQR = JSON.stringify({
  ticketNumber: "ACD2026-061476944",
  registrationId: "697488a747c097a064a5b457",
  name: "dfdf",
  email: "shreyanshumaske1966@gmail.com",
  eventCode: "ACD-2026",
  generatedAt: new Date().toISOString()
});

console.log('\nTesting valid group member QR:');
console.log('Input:', validQR);
const result1 = verifyQRCode(validQR);
console.log('Result:', result1);

// Test QR without eventCode
const noEventCode = JSON.stringify({
  ticketNumber: "ACD2026-061476944",
  registrationId: "697488a747c097a064a5b457"
});

console.log('\nTesting QR without eventCode:');
console.log('Input:', noEventCode);
const result2 = verifyQRCode(noEventCode);
console.log('Result:', result2);

// Test wrong eventCode
const wrongEventCode = JSON.stringify({
  ticketNumber: "ACD2026-061476944",
  registrationId: "697488a747c097a064a5b457",
  eventCode: "WRONG-2026"
});

console.log('\nTesting wrong eventCode:');
console.log('Input:', wrongEventCode);
const result3 = verifyQRCode(wrongEventCode);
console.log('Result:', result3);

// Test invalid QR data
const invalidQR = 'invalid-qr-data';
console.log('\nTesting invalid QR:');
console.log('Input:', invalidQR);
const result4 = verifyQRCode(invalidQR);
console.log('Result:', result4);