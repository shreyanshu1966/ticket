// check-duplicates.js - Script to check for duplicates in existing data
const database = require('./database');
const DuplicateChecker = require('./duplicate-checker');

async function checkDuplicates() {
    console.log('🔍 Duplicate Data Checker');
    console.log('========================\n');

    try {
        // Connect to database
        const connected = await database.connect();
        if (!connected) {
            console.error('❌ Failed to connect to database');
            process.exit(1);
        }

        console.log('✅ Connected to database');

        // Generate comprehensive integrity report
        console.log('\n📊 Generating data integrity report...');
        const report = await DuplicateChecker.getIntegrityReport();

        if (report.error) {
            console.error('❌ Error generating report:', report.error);
            return;
        }

        // Display summary
        console.log('\n📈 SUMMARY:');
        console.log('==========');
        console.log(`Total Attendees: ${report.summary.totalAttendees}`);
        console.log(`Total Tickets: ${report.summary.totalTickets}`);
        console.log(`Emails Successfully Sent: ${report.summary.emailsSent}`);
        console.log(`Failed Email Attempts: ${report.summary.emailsFailed}`);
        console.log(`Attendees Without Tickets: ${report.summary.attendeesWithoutTickets}`);
        console.log(`Duplicate Attendees: ${report.summary.duplicateAttendees}`);
        console.log(`Duplicate Ticket IDs: ${report.summary.duplicateTicketIds}`);
        console.log(`Attendees with Multiple Tickets: ${report.summary.duplicateAttendeeTickets}`);

        // Overall status
        console.log(`\n🎯 Data Integrity: ${report.isValid ? '✅ VALID' : '❌ ISSUES FOUND'}`);

        // Show detailed issues if any
        if (!report.isValid) {
            console.log('\n🚨 DETAILED ISSUES:');
            console.log('==================');

            if (report.details.duplicateAttendees.length > 0) {
                console.log('\n👥 Duplicate Attendees:');
                report.details.duplicateAttendees.forEach((dup, index) => {
                    console.log(`   ${index + 1}. Email: ${dup.email} (${dup.count} duplicates)`);
                    dup.attendees.forEach((att, i) => {
                        console.log(`      ${i + 1}. ${att.name} (ID: ${att.id}, Registered: ${att.registrationDate})`);
                    });
                });
            }

            if (report.details.duplicateTickets.duplicateTicketIds.length > 0) {
                console.log('\n🎫 Duplicate Ticket IDs:');
                report.details.duplicateTickets.duplicateTicketIds.forEach((dup, index) => {
                    console.log(`   ${index + 1}. Ticket ID: ${dup.ticketId} (${dup.count} duplicates)`);
                });
            }

            if (report.details.duplicateTickets.duplicateAttendeeIds.length > 0) {
                console.log('\n👤 Attendees with Multiple Tickets:');
                report.details.duplicateTickets.duplicateAttendeeIds.forEach((dup, index) => {
                    console.log(`   ${index + 1}. Attendee ID: ${dup.attendeeId} (${dup.count} tickets)`);
                    dup.tickets.forEach((ticket, i) => {
                        console.log(`      ${i + 1}. ${ticket.ticketId} (Email Sent: ${ticket.emailSent})`);
                    });
                });
            }
        }

        // Show attendees without tickets
        if (report.details.attendeesWithoutTickets.length > 0) {
            console.log('\n📭 Attendees Without Tickets:');
            console.log('============================');
            report.details.attendeesWithoutTickets.forEach((att, index) => {
                console.log(`   ${index + 1}. ${att.name} (${att.email}) - Status: ${att.status}`);
            });
        }

        // Offer cleanup if issues found
        if (!report.isValid) {
            console.log('\n🛠️  RECOMMENDATIONS:');
            console.log('====================');
            
            if (report.details.duplicateAttendees.length > 0) {
                console.log('• Run cleanup to remove duplicate attendees (keeps oldest registration)');
            }
            
            if (report.details.duplicateTickets.duplicateAttendeeIds.length > 0) {
                console.log('• Manual review required for attendees with multiple tickets');
            }
            
            if (report.details.duplicateTickets.duplicateTicketIds.length > 0) {
                console.log('• Manual review required for duplicate ticket IDs');
            }

            console.log('\n💡 To clean up duplicate attendees automatically, run:');
            console.log('   node cleanup-duplicates.js');
        } else {
            console.log('\n🎉 Congratulations! Your data is clean and duplicate-free!');
        }

    } catch (error) {
        console.error('❌ Error checking duplicates:', error.message);
    } finally {
        await database.disconnect();
        console.log('\n🔌 Disconnected from database');
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n⏹️  Check interrupted by user');
    await database.disconnect();
    process.exit(0);
});

// Run if called directly
if (require.main === module) {
    checkDuplicates();
}

module.exports = { checkDuplicates };