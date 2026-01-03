import dotenv from 'dotenv'
import { sendConfirmationEmail } from './services/emailService.js'

// Load environment variables
dotenv.config()

// Test registration data for maskewebsol@gmail.com
const testRegistration = {
  _id: '67f9a1b2c3d4e5f6789054321',
  name: 'Test User',
  email: 'maskewebsol@gmail.com',
  phone: '+91 9999999999',
  college: 'Test College for ACD 2025',
  year: 'Final Year',
  amount: 199,
  createdAt: new Date(),
  paymentStatus: 'completed',
  paymentId: 'test_payment_123456',
  orderId: 'test_order_654321',
  paymentDate: new Date()
}

async function sendTestTicket() {
  console.log('🎫 Sending Test Ticket to maskewebsol@gmail.com...\n')
  
  try {
    console.log('📋 Test Registration Details:')
    console.log(`   Name: ${testRegistration.name}`)
    console.log(`   Email: ${testRegistration.email}`)
    console.log(`   College: ${testRegistration.college}`)
    console.log(`   Year: ${testRegistration.year}`)
    console.log(`   Amount: ₹${testRegistration.amount}`)
    console.log(`   Registration Date: ${testRegistration.createdAt.toLocaleString('en-IN')}`)
    console.log('')
    
    console.log('📧 Sending confirmation email with ticket...')
    
    // Send the confirmation email with ticket
    const result = await sendConfirmationEmail(testRegistration)
    
    if (result.success) {
      console.log('✅ Email sent successfully!')
      console.log(`   Message ID: ${result.messageId}`)
      console.log(`   Ticket Number: ${result.ticketNumber}`)
      console.log(`   QR Code Generated: ${result.qrCode ? 'YES' : 'NO'}`)
      console.log('')
      console.log('🎉 Test ticket has been sent to maskewebsol@gmail.com')
      console.log('📱 Please check the email for:')
      console.log('   • Event details (ACD 2025, Jan 29-30, 2026)')
      console.log('   • Registration information')
      console.log('   • QR code ticket')
      console.log('   • Entry instructions')
    } else {
      console.error('❌ Email sending failed:')
      console.error(`   Error: ${result.error}`)
    }
    
  } catch (error) {
    console.error('❌ Test email sending failed:', error.message)
    console.error('   Please check:')
    console.error('   • Email configuration in .env file')
    console.error('   • SMTP server settings')
    console.error('   • Network connectivity')
  }
}

// Run the test
console.log('🚀 Starting ACD 2025 Test Ticket Sender...\n')
sendTestTicket().catch(console.error)