// check-database.js - Debug script to check database contents
const database = require('./database');
const { Attendee, Ticket } = require('./models');

async function checkDatabase() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await database.connect();
        
        console.log('\n📊 ATTENDEES IN DATABASE:');
        const attendees = await Attendee.find({}).sort({ createdAt: -1 });
        
        if (attendees.length === 0) {
            console.log('   No attendees found in database');
        } else {
            attendees.forEach((attendee, index) => {
                console.log(`   ${index + 1}. Name: "${attendee.name}"`);
                console.log(`      Email: "${attendee.email}"`);
                console.log(`      Status: "${attendee.status}"`);
                console.log(`      Created: ${attendee.createdAt}`);
                console.log(`      ID: ${attendee._id}`);
                console.log('');
            });
        }
        
        console.log('\n🎫 TICKETS IN DATABASE:');
        const tickets = await Ticket.find({}).sort({ createdAt: -1 });
        
        if (tickets.length === 0) {
            console.log('   No tickets found in database');
        } else {
            tickets.forEach((ticket, index) => {
                console.log(`   ${index + 1}. Ticket ID: "${ticket.ticketId}"`);
                console.log(`      Attendee Name: "${ticket.attendeeName}"`);
                console.log(`      Attendee Email: "${ticket.attendeeEmail}"`);
                console.log(`      Email Sent: ${ticket.emailSent}`);
                console.log(`      Created: ${ticket.createdAt}`);
                console.log('');
            });
        }
        
        // Check for specific attendee
        console.log('\n🔍 SEARCHING FOR "krish Mali":');
        const krishSearch = await Attendee.find({
            $or: [
                { name: /krish.*mali/i },
                { email: /krishmaliaia7/i }
            ]
        });
        
        if (krishSearch.length === 0) {
            console.log('   No attendee found matching "krish Mali"');
        } else {
            krishSearch.forEach((attendee, index) => {
                console.log(`   Match ${index + 1}:`);
                console.log(`      Name: "${attendee.name}"`);
                console.log(`      Email: "${attendee.email}"`);
                console.log(`      Status: "${attendee.status}"`);
                console.log(`      Created: ${attendee.createdAt}`);
                console.log('');
            });
        }
        
        console.log('\n📧 EMAIL EXACT MATCH CHECK:');
        const emailCheck = await Attendee.findOne({ email: 'krishmaliaia7@gmail.com' });
        if (emailCheck) {
            console.log('   ✅ Found exact email match:');
            console.log(`      Name: "${emailCheck.name}"`);
            console.log(`      Email: "${emailCheck.email}"`);
            console.log(`      Status: "${emailCheck.status}"`);
            console.log(`      Created: ${emailCheck.createdAt}`);
        } else {
            console.log('   ❌ No exact email match found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await database.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

checkDatabase();