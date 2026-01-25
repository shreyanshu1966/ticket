// Get real ticket data for testing
import connectDB from './config/database.js'
import Registration from './models/Registration.js'
import mongoose from 'mongoose'

const getTicketData = async () => {
  await connectDB()
  
  console.log('🎫 Finding completed registrations...')
  
  const registrations = await Registration.find({ 
    paymentStatus: 'completed' 
  }).limit(2)
  
  console.log(`Found ${registrations.length} completed registrations:`)
  
  registrations.forEach((reg, index) => {
    console.log(`\n${index + 1}. Primary Ticket:`)
    console.log(`   QR Data: REG_${reg._id}_${reg.ticketNumber}`)
    console.log(`   Name: ${reg.name}`)
    console.log(`   Email: ${reg.email}`)
    console.log(`   Ticket: ${reg.ticketNumber}`)
    
    if (reg.groupMembers && reg.groupMembers.length > 0) {
      console.log(`   Group Members:`)
      reg.groupMembers.forEach((member, idx) => {
        console.log(`   ${idx + 1}. QR Data: REG_${reg._id}_${member.ticketNumber}`)
        console.log(`      Name: ${member.name}`)
        console.log(`      Email: ${member.email}`)
        console.log(`      Ticket: ${member.ticketNumber}`)
      })
    }
  })
  
  await mongoose.disconnect()
  console.log('\n✅ Disconnected from MongoDB')
}

getTicketData().catch(console.error)