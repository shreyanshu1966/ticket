// test-mongodb.js - Test MongoDB connection and duplicate handling
const database = require('./database');
const { Attendee, Ticket, EmailLog, EventStats } = require('./models');
const DuplicateChecker = require('./duplicate-checker');
const TicketIdValidator = require('./ticket-id-validator');
const config = require('./config');

async function testMongoDBConnection() {
    console.log('🧪 Testing MongoDB Connection & Duplicate Handling');
    console.log('=================================================\n');

    try {
        // Test database connection
        console.log('1. Testing database connection...');
        const connected = await database.connect();
        
        if (!connected) {
            console.error('❌ Failed to connect to MongoDB');
            return false;
        }

        console.log('✅ Successfully connected to MongoDB');
        console.log(`📊 Database: ${database.connection?.connection?.name || 'N/A'}`);
        console.log(`🖥️  Host: ${database.connection?.connection?.host || 'N/A'}:${database.connection?.connection?.port || 'N/A'}`);

        // Test duplicate prevention
        console.log('\n2. Testing duplicate prevention...');
        
        // Test duplicate attendee prevention
        console.log('   Testing duplicate attendee prevention...');
        const attendeeData = {
            name: 'Test User',
            email: 'test@example.com',
            phone: '+1234567890',
            college: 'Test College',
            department: 'Computer Science',
            year: '2024',
            status: 'registered'
        };

        // Create first attendee
        const attendee1 = new Attendee(attendeeData);
        await attendee1.save();
        console.log('   ✅ First attendee created');

        // Try to create duplicate attendee
        try {
            const attendee2 = new Attendee(attendeeData);
            await attendee2.save();
            console.log('   ❌ Duplicate attendee was allowed - this should not happen!');
            return false;
        } catch (error) {
            if (error.code === 11000) {
                console.log('   ✅ Duplicate attendee correctly prevented');
            } else {
                console.log('   ❌ Unexpected error:', error.message);
                return false;
            }
        }

        // Test duplicate ticket prevention
        console.log('   Testing duplicate ticket prevention...');
        const ticketData = {
            ticketId: 'SHAKTI2025-TEST001',
            qrCodeData: JSON.stringify({ test: 'data' }),
            attendeeId: attendee1._id,
            attendeeName: attendee1.name,
            attendeeEmail: attendee1.email,
            eventName: config.event.name,
            eventDate: config.event.date,
            eventTime: config.event.time,
            eventVenue: config.event.venue
        };

        // Create first ticket
        const ticket1 = new Ticket(ticketData);
        await ticket1.save();
        console.log('   ✅ First ticket created');

        // Try to create duplicate ticket for same attendee
        try {
            const ticket2 = new Ticket({
                ...ticketData,
                ticketId: 'SHAKTI2025-TEST002' // Different ticket ID, same attendee
            });
            await ticket2.save();
            console.log('   ❌ Duplicate ticket for same attendee was allowed - this should not happen!');
            return false;
        } catch (error) {
            if (error.code === 11000) {
                console.log('   ✅ Duplicate ticket for same attendee correctly prevented');
            } else {
                console.log('   ❌ Unexpected error:', error.message);
                return false;
            }
        }

        // Try to create ticket with duplicate ticket ID
        const attendee3 = new Attendee({
            name: 'Another User',
            email: 'another@example.com',
            phone: '+9876543210',
            college: 'Another College',
            status: 'registered'
        });
        await attendee3.save();

        try {
            const ticket3 = new Ticket({
                ...ticketData,
                attendeeId: attendee3._id,
                attendeeName: attendee3.name,
                attendeeEmail: attendee3.email
            });
            await ticket3.save();
            console.log('   ❌ Duplicate ticket ID was allowed - this should not happen!');
            return false;
        } catch (error) {
            if (error.code === 11000) {
                console.log('   ✅ Duplicate ticket ID correctly prevented');
            } else {
                console.log('   ❌ Unexpected error:', error.message);
                return false;
            }
        }

        // Test event stats
        console.log('\n3. Testing event statistics...');
        const eventStats = new EventStats({
            eventName: config.event.name,
            totalRegistrations: 2,
            totalTicketsSent: 0,
            totalEmailsSent: 0,
            totalEmailsFailed: 0
        });

        await eventStats.save();
        console.log('   ✅ Event statistics created');

        // Test duplicate checker
        console.log('\n4. Testing duplicate checker utility...');
        const integrityReport = await DuplicateChecker.getIntegrityReport();
        console.log('   📊 Integrity Report:');
        console.log(`      Total Attendees: ${integrityReport.summary.totalAttendees}`);
        console.log(`      Total Tickets: ${integrityReport.summary.totalTickets}`);
        console.log(`      Duplicate Attendees: ${integrityReport.summary.duplicateAttendees}`);
        console.log(`      Duplicate Ticket IDs: ${integrityReport.summary.duplicateTicketIds}`);
        console.log(`      Duplicate Attendee Tickets: ${integrityReport.summary.duplicateAttendeeTickets}`);
        console.log(`      Ticket ID Validation: ${integrityReport.summary.ticketIdValidation?.isValid ? '✅ Valid' : '❌ Invalid'}`);
        console.log(`      Data Integrity: ${integrityReport.isValid ? '✅ Valid' : '❌ Invalid'}`);

        // Test ticket ID uniqueness
        console.log('\n5. Testing ticket ID uniqueness...');
        const ticketIdTest = await TicketIdValidator.testTicketIdGeneration(100);
        console.log(`   🎫 Generated ${ticketIdTest.totalGenerated} test ticket IDs`);
        console.log(`   🔢 Unique IDs: ${ticketIdTest.uniqueIds}`);
        console.log(`   ⚡ Collision rate: ${ticketIdTest.collisionRate}`);
        console.log(`   🎯 Result: ${ticketIdTest.success ? '✅ PASS' : '❌ FAIL'}`);

        if (!ticketIdTest.success && ticketIdTest.collisionDetails && ticketIdTest.collisionDetails.length > 0) {
            console.log('   ⚠️  Sample collisions:');
            ticketIdTest.collisionDetails.slice(0, 3).forEach((collision, i) => {
                console.log(`      ${i + 1}. ${collision.ticketId}`);
            });
        }
        // Verify data
        console.log('\n6. Verifying final data...');
        const attendeeCount = await Attendee.countDocuments();
        const ticketCount = await Ticket.countDocuments();
        const statsCount = await EventStats.countDocuments();

        console.log(`   👥 Attendees in database: ${attendeeCount} (expected: 2)`);
        console.log(`   🎫 Tickets in database: ${ticketCount} (expected: 1)`);
        console.log(`   📊 Event stats records: ${statsCount} (expected: 1)`);

        // Clean up test data
        console.log('\n7. Cleaning up test data...');
        await Attendee.deleteMany({ email: { $in: ['test@example.com', 'another@example.com'] } });
        await Ticket.deleteMany({ ticketId: { $regex: '^SHAKTI2025-TEST' } });
        await EventStats.deleteOne({ eventName: config.event.name });
        console.log('   🗑️  Test data cleaned up');

        // Get connection stats
        console.log('\n8. Connection statistics:');
        const stats = database.getConnectionStats();
        console.log('   Status:', stats.status);
        console.log('   Ready State:', stats.readyState);
        console.log('   Collections:', stats.collections?.join(', ') || 'None');

        console.log('\n✅ All MongoDB tests passed!');
        console.log('🎉 Your MongoDB setup correctly prevents duplicates!');
        console.log('\n🔒 Duplicate Prevention Summary:');
        console.log('   • One email = One attendee (enforced by unique constraint)');
        console.log('   • One attendee = One ticket (enforced by unique constraint)');
        console.log('   • Unique ticket IDs (enforced by unique constraint)');
        console.log('   • Comprehensive duplicate checking utilities available');

        return true;

    } catch (error) {
        console.error('\n❌ MongoDB test failed:', error.message);
        console.error('\n💡 Common solutions:');
        console.error('1. Make sure MongoDB is running on your system');
        console.error('2. Check your MONGODB_URI in .env file');
        console.error('3. Verify network connectivity');
        console.error('4. Check MongoDB authentication credentials');
        return false;

    } finally {
        // Disconnect from database
        await database.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Main execution
async function main() {
    const success = await testMongoDBConnection();
    process.exit(success ? 0 : 1);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n⏹️  Test interrupted by user');
    await database.disconnect();
    process.exit(0);
});

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { testMongoDBConnection };