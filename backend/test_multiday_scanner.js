import mongoose from 'mongoose'
import Registration from './models/Registration.js'
import EventEntry from './models/EventEntry.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testMultiDayScanner() {
  try {
    console.log('🧪 TESTING MULTI-DAY SCANNER FUNCTIONALITY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')
    
    // Find a test registration with completed payment
    const testRegistration = await Registration.findOne({ 
      paymentStatus: 'completed',
      ticketNumber: { $exists: true, $ne: null }
    }).limit(1)
    
    if (!testRegistration) {
      console.log('❌ No completed registration found for testing')
      return
    }
    
    console.log('\n📋 Test Registration Found:')
    console.log(`   ID: ${testRegistration._id}`)
    console.log(`   Name: ${testRegistration.name}`)
    console.log(`   Email: ${testRegistration.email}`)
    console.log(`   Ticket: ${testRegistration.ticketNumber}`)
    console.log(`   Payment Status: ${testRegistration.paymentStatus}`)
    
    // Test Day 1 Entry
    console.log('\n🎫 TESTING DAY 1 ENTRY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const day1Entry = new EventEntry({
      registrationId: testRegistration._id,
      ticketNumber: testRegistration.ticketNumber,
      attendeeName: testRegistration.name,
      attendeeEmail: testRegistration.email,
      attendeeCollege: testRegistration.college,
      attendeeYear: testRegistration.year,
      day: 1,
      isGroupMember: false
    })
    
    await day1Entry.save()
    console.log('✅ Day 1 entry created successfully')
    console.log(`   Entry ID: ${day1Entry._id}`)
    console.log(`   Entry Date: ${day1Entry.entryDate}`)
    
    // Test Day 2 Entry (same ticket)
    console.log('\n🎫 TESTING DAY 2 ENTRY (Same Ticket)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const day2Entry = new EventEntry({
      registrationId: testRegistration._id,
      ticketNumber: testRegistration.ticketNumber,
      attendeeName: testRegistration.name,
      attendeeEmail: testRegistration.email,
      attendeeCollege: testRegistration.college,
      attendeeYear: testRegistration.year,
      day: 2,
      isGroupMember: false
    })
    
    await day2Entry.save()
    console.log('✅ Day 2 entry created successfully')
    console.log(`   Entry ID: ${day2Entry._id}`)
    console.log(`   Entry Date: ${day2Entry.entryDate}`)
    
    // Test Duplicate Day 1 Entry
    console.log('\n🚫 TESTING DUPLICATE DAY 1 ENTRY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    try {
      const duplicateDay1Entry = new EventEntry({
        registrationId: testRegistration._id,
        ticketNumber: testRegistration.ticketNumber,
        attendeeName: testRegistration.name,
        attendeeEmail: testRegistration.email,
        attendeeCollege: testRegistration.college,
        attendeeYear: testRegistration.year,
        day: 1,
        isGroupMember: false
      })
      
      await duplicateDay1Entry.save()
      console.log('❌ Duplicate entry was allowed (This should not happen!)')
    } catch (duplicateError) {
      console.log('✅ Duplicate Day 1 entry correctly rejected')
      console.log(`   Error: ${duplicateError.message}`)
      console.log(`   Code: ${duplicateError.code}`)
    }
    
    // Test Statistics
    console.log('\n📊 TESTING STATISTICS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const dailyStats = await EventEntry.getDailyStats()
    console.log('Daily Stats:', JSON.stringify(dailyStats, null, 2))
    
    const bothDaysAttendees = await EventEntry.getBothDaysAttendees()
    console.log('\nBoth Days Attendees:', bothDaysAttendees.length)
    if (bothDaysAttendees.length > 0) {
      console.log('Sample:', JSON.stringify(bothDaysAttendees[0], null, 2))
    }
    
    const uniqueAttendees = await EventEntry.distinct('ticketNumber')
    console.log(`\nTotal Unique Attendees: ${uniqueAttendees.length}`)
    
    // Test Queries
    console.log('\n🔍 TESTING QUERIES')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const day1Entries = await EventEntry.countDocuments({ day: 1 })
    const day2Entries = await EventEntry.countDocuments({ day: 2 })
    const totalEntries = await EventEntry.countDocuments()
    
    console.log(`Day 1 Entries: ${day1Entries}`)
    console.log(`Day 2 Entries: ${day2Entries}`)
    console.log(`Total Entries: ${totalEntries}`)
    
    // Check specific ticket entries
    const ticketEntries = await EventEntry.find({
      ticketNumber: testRegistration.ticketNumber
    }).sort({ day: 1 })
    
    console.log(`\nEntries for ticket ${testRegistration.ticketNumber}:`)
    ticketEntries.forEach(entry => {
      console.log(`   Day ${entry.day}: ${entry.entryDate} (${entry.attendeeName})`)
    })
    
    console.log('\n✅ MULTI-DAY SCANNER TEST COMPLETED SUCCESSFULLY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
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
  testMultiDayScanner()
}

export default testMultiDayScanner