// cleanup-test-data.js - Clean up test data from MongoDB
const database = require('./database');
const { Attendee, Ticket, EmailLog, EventStats } = require('./models');

async function cleanupTestData() {
    console.log('🧹 Cleaning up test data from MongoDB...');
    
    try {
        // Connect to database
        const connected = await database.connect();
        if (!connected) {
            console.error('❌ Failed to connect to MongoDB');
            return false;
        }

        console.log('✅ Connected to MongoDB');

        // Clean up test data
        console.log('🗑️  Removing test attendees...');
        const attendeeResult = await Attendee.deleteMany({ 
            email: { $in: ['test@example.com', 'another@example.com'] } 
        });
        console.log(`   Removed ${attendeeResult.deletedCount} test attendees`);

        console.log('🗑️  Removing test tickets...');
        const ticketResult = await Ticket.deleteMany({ 
            ticketId: { $regex: '^SHAKTI2025-TEST' } 
        });
        console.log(`   Removed ${ticketResult.deletedCount} test tickets`);

        console.log('🗑️  Removing test event stats...');
        const statsResult = await EventStats.deleteMany({ 
            eventName: 'SHAKTI' 
        });
        console.log(`   Removed ${statsResult.deletedCount} test event stats`);

        console.log('🗑️  Removing test email logs...');
        const emailResult = await EmailLog.deleteMany({
            to: { $in: ['test@example.com', 'another@example.com'] }
        });
        console.log(`   Removed ${emailResult.deletedCount} test email logs`);

        console.log('✅ Test data cleanup completed');
        return true;

    } catch (error) {
        console.error('❌ Error cleaning up test data:', error.message);
        return false;
    } finally {
        await database.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run cleanup
async function main() {
    const success = await cleanupTestData();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = { cleanupTestData };