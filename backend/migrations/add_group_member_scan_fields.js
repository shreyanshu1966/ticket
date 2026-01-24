import mongoose from 'mongoose'
import Registration from '../models/Registration.js'

// Migration to add missing scan fields to existing group members
async function addGroupMemberScanFields() {
  try {
    console.log('🔄 Starting migration to add scan fields to group members...')
    
    await mongoose.connect('mongodb://localhost:27017/eventregistration')
    console.log('✅ Connected to MongoDB')
    
    // Find all registrations with group members
    const groupBookings = await Registration.find({
      isGroupBooking: true,
      'groupMembers.0': { $exists: true }
    })
    
    console.log(`📊 Found ${groupBookings.length} group bookings to update`)
    
    let totalUpdated = 0
    let totalMembers = 0
    
    for (const booking of groupBookings) {
      let needsUpdate = false
      
      // Check each group member for missing fields
      for (const member of booking.groupMembers) {
        totalMembers++
        
        if (member.isScanned === undefined || 
            member.entryConfirmed === undefined) {
          needsUpdate = true
          
          // Set default values
          member.isScanned = member.isScanned || false
          member.entryConfirmed = member.entryConfirmed || false
          // scannedAt remains undefined if not scanned
          
          console.log(`🔧 Updating member: ${member.name} (${member.ticketNumber})`)
        }
      }
      
      if (needsUpdate) {
        await booking.save()
        totalUpdated++
        console.log(`✅ Updated booking: ${booking.name}`)
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY')
    console.log(`📊 Statistics:`)
    console.log(`   Group Bookings Processed: ${groupBookings.length}`)
    console.log(`   Bookings Updated: ${totalUpdated}`)
    console.log(`   Total Group Members: ${totalMembers}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    console.log('\n✅ All group members now have scan tracking fields')
    console.log('📋 Each group member can now be individually tracked for:')
    console.log('   • isScanned: Whether ticket has been scanned')
    console.log('   • scannedAt: When the ticket was scanned')
    console.log('   • entryConfirmed: Whether entry was confirmed')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

// Run migration
addGroupMemberScanFields()