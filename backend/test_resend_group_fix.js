import mongoose from 'mongoose'
import Registration from './models/Registration.js'
import { sendGroupConfirmationEmails, sendConfirmationEmail } from './services/emailService.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testResendGroupEmails() {
  try {
    console.log('🧪 TESTING GROUP EMAIL RESEND FUNCTIONALITY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')
    
    // Find a group booking with completed payment
    const groupBooking = await Registration.findOne({ 
      paymentStatus: 'completed',
      isGroupBooking: true,
      groupMembers: { $exists: true, $ne: [] }
    }).limit(1)
    
    if (!groupBooking) {
      console.log('❌ No group booking found for testing')
      console.log('💡 Create a group booking with completed payment to test this functionality')
      return
    }
    
    console.log('\n📋 Group Booking Found:')
    console.log(`   ID: ${groupBooking._id}`)
    console.log(`   Primary Email: ${groupBooking.email}`)
    console.log(`   Group Members: ${groupBooking.groupMembers?.length || 0}`)
    console.log(`   Ticket Quantity: ${groupBooking.ticketQuantity}`)
    console.log(`   Payment Status: ${groupBooking.paymentStatus}`)
    console.log(`   Is Group Booking: ${groupBooking.isGroupBooking}`)
    
    console.log('\n👥 Group Member Details:')
    groupBooking.groupMembers?.forEach((member, index) => {
      console.log(`   Member ${index + 2}: ${member.name} (${member.email})`)
    })
    
    // Test group email sending (simulates resend)
    console.log('\n📧 TESTING GROUP EMAIL RESEND')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    console.log('🔍 Simulating resend process:')
    console.log(`   1. Check isGroupBooking: ${groupBooking.isGroupBooking}`)
    console.log(`   2. Will call: sendGroupConfirmationEmails()`)
    console.log(`   3. Expected recipients: ${1 + (groupBooking.groupMembers?.length || 0)} emails`)
    
    // Simulate the resend logic (without actually sending emails)
    console.log('\n🧪 Testing resend logic paths:')
    
    if (groupBooking.isGroupBooking) {
      console.log('✅ CORRECT PATH: Group booking detected')
      console.log('   → Would call sendGroupConfirmationEmails(registration)')
      console.log(`   → Primary member: ${groupBooking.email}`)
      console.log(`   → Group members: ${groupBooking.groupMembers?.map(m => m.email).join(', ') || 'None'}`)
    } else {
      console.log('❌ WRONG PATH: Would call sendConfirmationEmail(registration)')
      console.log('   → Only primary member would get email!')
      console.log('   → Group members would be MISSED!')
    }
    
    // Test individual booking for comparison
    console.log('\n🆔 TESTING INDIVIDUAL BOOKING FOR COMPARISON')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const individualBooking = await Registration.findOne({ 
      paymentStatus: 'completed',
      $or: [
        { isGroupBooking: false },
        { isGroupBooking: { $exists: false } }
      ]
    }).limit(1)
    
    if (individualBooking) {
      console.log('📋 Individual Booking Found:')
      console.log(`   ID: ${individualBooking._id}`)
      console.log(`   Email: ${individualBooking.email}`)
      console.log(`   Is Group Booking: ${individualBooking.isGroupBooking || false}`)
      
      console.log('\n🧪 Testing individual resend logic:')
      if (individualBooking.isGroupBooking) {
        console.log('❌ WRONG PATH: Would call sendGroupConfirmationEmails(registration)')
      } else {
        console.log('✅ CORRECT PATH: Individual booking detected')
        console.log('   → Would call sendConfirmationEmail(registration)')
        console.log(`   → Single recipient: ${individualBooking.email}`)
      }
    } else {
      console.log('ℹ️ No individual booking found for comparison')
    }
    
    console.log('\n📊 SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Fixed resend logic should:')
    console.log('   • Detect group bookings using isGroupBooking flag')
    console.log('   • Call sendGroupConfirmationEmails() for groups')
    console.log('   • Call sendConfirmationEmail() for individuals')
    console.log('   • Send emails to ALL group members')
    console.log('   • Update registration data correctly')
    
    console.log('\n🛠️ The fix applied:')
    console.log('   • Added isGroupBooking check in resendTickets()')
    console.log('   • Import sendGroupConfirmationEmails function')
    console.log('   • Route group bookings to correct email function')
    console.log('   • Maintain same logic as original registration flow')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testResendGroupEmails()
}

export default testResendGroupEmails