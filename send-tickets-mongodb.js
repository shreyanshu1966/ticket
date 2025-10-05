// send-tickets-mongodb.js - Enhanced ticket sender with MongoDB integration
const nodemailer = require('nodemailer');
const csv = require('csv-parser');
const fs = require('fs');
const QRCode = require('qrcode');
const config = require('./config');
const { generateTicketTemplate } = require('./email-template');
const database = require('./database');
const { Attendee, Ticket, EmailLog, EventStats } = require('./models');

class TicketSenderMongoDB {
    constructor() {
        this.transporter = null;
        this.successCount = 0;
        this.errorCount = 0;
        this.errors = [];
        this.dbConnected = false;
    }

    // Initialize database connection
    async initDatabase() {
        try {
            this.dbConnected = await database.connect();
            if (this.dbConnected) {
                console.log('✅ Database connection established');
                await this.initializeEventStats();
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Failed to initialize database:', error.message);
            return false;
        }
    }

    // Initialize email transporter
    async initTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: config.email.host,
                port: config.email.port,
                secure: config.email.secure,
                auth: {
                    user: config.email.user,
                    pass: config.email.password
                },
                tls: {
                    rejectUnauthorized: false,
                    servername: config.email.host
                }
            });

            console.log('✅ Email transporter initialized successfully');
            console.log(`📧 Using email: ${config.email.user}`);
            console.log(`🖥️  SMTP Server: ${config.email.host}:${config.email.port}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize email transporter:', error.message);
            return false;
        }
    }

    // Initialize event statistics
    async initializeEventStats() {
        try {
            let stats = await EventStats.findOne({ eventName: config.event.name });
            if (!stats) {
                stats = new EventStats({
                    eventName: config.event.name,
                    totalRegistrations: 0,
                    totalTicketsSent: 0,
                    totalEmailsSent: 0,
                    totalEmailsFailed: 0,
                    totalAttendees: 0
                });
                await stats.save();
                console.log('📊 Event statistics initialized');
            }
            return stats;
        } catch (error) {
            console.error('❌ Error initializing event stats:', error.message);
            throw error;
        }
    }

    // Generate unique ticket ID with collision detection
    async generateUniqueTicketId(attendee, index = 1) {
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            // Create base components
            const timestamp = Date.now().toString().slice(-6);
            const nameCode = attendee.Name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
            const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
            const indexPadded = String(index + attempts).padStart(3, '0');
            
            // Generate ticket ID
            const ticketId = `${config.qr.ticketPrefix}-${nameCode}${timestamp}-${indexPadded}-${randomSuffix}`;
            
            // Check if this ticket ID already exists
            const existingTicket = await Ticket.findOne({ ticketId: ticketId });
            
            if (!existingTicket) {
                console.log(`🎫 Generated unique ticket ID: ${ticketId} (attempt ${attempts + 1})`);
                return ticketId;
            }
            
            console.log(`⚠️  Ticket ID collision detected: ${ticketId}, retrying...`);
            attempts++;
            
            // Add small delay to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Fallback: use UUID-style ticket ID
        const uuid = require('crypto').randomUUID();
        const fallbackId = `${config.qr.ticketPrefix}-${uuid.substr(0, 8).toUpperCase()}`;
        console.log(`🔄 Using fallback ticket ID: ${fallbackId}`);
        return fallbackId;
    }

    // Generate QR code data
    generateQRData(attendee, ticketId) {
        return JSON.stringify({
            ticketId: ticketId,
            name: attendee.Name,
            email: attendee['Email id'],
            event: config.event.name,
            date: config.event.date,
            venue: config.event.venue,
            timestamp: new Date().toISOString()
        });
    }

    // Generate QR code as base64 image
    async generateQRCode(data) {
        try {
            const qrCodeDataURL = await QRCode.toDataURL(data, {
                type: 'image/png',  // Explicitly specify PNG format
                width: config.qr.size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M',  // Medium error correction
                quality: 0.92  // High quality
            });
            // Return base64 string without data URL prefix
            return qrCodeDataURL.split(',')[1];
        } catch (error) {
            console.error('❌ Error generating QR code:', error);
            throw error;
        }
    }

    // Generate QR code as PNG buffer for attachment
    async generateQRCodeBuffer(data) {
        try {
            return await QRCode.toBuffer(data, {
                type: 'png',  // PNG format
                width: config.qr.size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M',
                quality: 0.92
            });
        } catch (error) {
            console.error('❌ Error generating QR code buffer:', error);
            throw error;
        }
    }

    // Save attendee to database
    async saveAttendee(attendeeData, additionalData = {}) {
        try {
            const email = attendeeData['Email id'].toLowerCase().trim();
            
            // Check if attendee already exists
            let attendee = await Attendee.findOne({ email: email });
            
            if (attendee) {
                console.log(`👤 Attendee ${attendeeData.Name} (${email}) already exists in database`);
                return attendee;
            }

            // Create new attendee
            attendee = new Attendee({
                name: attendeeData.Name.trim(),
                email: email,
                phone: (attendeeData['Contact no. '] || attendeeData.Phone || attendeeData['Phone number'] || '').trim(),
                college: (attendeeData.College || attendeeData.Institution || '').trim(),
                department: (attendeeData['Department and branch'] || attendeeData.Department || '').trim(),
                year: (attendeeData['Year '] || attendeeData.Year || attendeeData['Year of study'] || '').trim(),
                additionalData: new Map(Object.entries(additionalData)),
                status: 'registered'
            });

            await attendee.save();
            console.log(`👤 Saved new attendee: ${attendeeData.Name} (${email})`);
            
            // Update stats
            await this.updateEventStats({ totalRegistrations: 1 });
            
            return attendee;
        } catch (error) {
            console.error(`❌ Detailed error saving attendee ${attendeeData.Name}:`, {
                errorCode: error.code,
                errorMessage: error.message,
                errorName: error.name,
                keyPattern: error.keyPattern,
                keyValue: error.keyValue
            });
            
            if (error.code === 11000) {
                // Duplicate key error - attendee already exists
                console.log(`👤 Attendee ${attendeeData.Name} already exists (duplicate email detected)`);
                // Return existing attendee
                return await Attendee.findOne({ email: attendeeData['Email id'].toLowerCase().trim() });
            }
            console.error(`❌ Error saving attendee ${attendeeData.Name}:`, error.message);
            throw error;
        }
    }

    // Save ticket to database with enhanced duplicate prevention
    async saveTicket(attendee, attendeeDoc, qrCodeData) {
        try {
            // Check if ticket already exists for this attendee
            const existingTicket = await Ticket.findOne({ attendeeId: attendeeDoc._id });
            
            if (existingTicket) {
                console.log(`🎫 Ticket already exists for ${attendee.Name}: ${existingTicket.ticketId}`);
                return existingTicket;
            }

            // Generate guaranteed unique ticket ID
            const ticketId = await this.generateUniqueTicketId(attendee);

            const ticket = new Ticket({
                ticketId: ticketId,
                qrCodeData: qrCodeData,
                attendeeId: attendeeDoc._id,
                attendeeName: attendee.Name,
                attendeeEmail: attendee['Email id'].toLowerCase().trim(),
                eventName: config.event.name,
                eventDate: config.event.date,
                eventTime: config.event.time,
                eventVenue: config.event.venue,
                emailSent: false,
                emailAttempts: 0,
                isVerified: false,
                generatedBy: 'ticket-sender-mongodb'
            });

            await ticket.save();
            console.log(`🎫 Created new ticket: ${ticketId} for ${attendee.Name}`);
            return ticket;
        } catch (error) {
            if (error.code === 11000) {
                // Duplicate key error - this should be extremely rare now
                if (error.message.includes('attendeeId')) {
                    console.log(`🎫 Ticket already exists for attendee ${attendee.Name}`);
                    return await Ticket.findOne({ attendeeId: attendeeDoc._id });
                } else if (error.message.includes('ticketId')) {
                    console.error(`❌ Critical: Duplicate ticket ID after collision detection!`);
                    console.error(`This should not happen. Error:`, error.message);
                    // Generate a UUID-based ticket ID as emergency fallback
                    const uuid = require('crypto').randomUUID();
                    const emergencyId = `${config.qr.ticketPrefix}-EMERGENCY-${uuid.substr(0, 8).toUpperCase()}`;
                    console.log(`🆘 Using emergency ticket ID: ${emergencyId}`);
                    return await this.saveTicket(attendee, attendeeDoc, qrCodeData);
                }
            }
            console.error(`❌ Error saving ticket:`, error.message);
            throw error;
        }
    }

    // Log email attempt
    async logEmail(ticketDoc, status, error = null, messageId = null, response = null) {
        try {
            const emailLog = new EmailLog({
                to: ticketDoc.attendeeEmail,
                subject: `🎫 Your ${config.event.name} Event Ticket - ${ticketDoc.ticketId}`,
                ticketId: ticketDoc.ticketId,
                attendeeId: ticketDoc.attendeeId,
                ticketObjectId: ticketDoc._id,
                status: status,
                error: error ? {
                    message: error.message,
                    code: error.code,
                    stack: error.stack
                } : undefined,
                messageId: messageId,
                response: response,
                attempts: ticketDoc.emailAttempts + 1
            });

            await emailLog.save();
        } catch (logError) {
            console.error('❌ Error logging email:', logError.message);
        }
    }

    // Send email to individual attendee
    async sendTicketEmail(attendee, attendeeDoc, ticketDoc, qrCodeBuffer) {
        try {
            const htmlContent = generateTicketTemplate(attendee, 'placeholder', ticketDoc.ticketId);
            
            const mailOptions = {
                from: `"${config.sender.name}" <${config.sender.email}>`,
                to: attendee['Email id'],
                subject: `🎫 Your ${config.event.name} Event Ticket - ${ticketDoc.ticketId}`,
                html: htmlContent,
                attachments: [
                    {
                        filename: 'banner.jpg',
                        path: './banner-compressed.jpg',
                        cid: 'banner'
                    },
                    {
                        filename: `${config.event.name}-ticket-${ticketDoc.ticketId}.png`,
                        content: qrCodeBuffer,
                        cid: 'qrcode'
                    }
                ]
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            // Update ticket status in database
            await Ticket.findByIdAndUpdate(ticketDoc._id, {
                emailSent: true,
                emailSentAt: new Date(),
                emailAttempts: ticketDoc.emailAttempts + 1,
                emailError: null
            });

            // Update attendee status
            await Attendee.findByIdAndUpdate(attendeeDoc._id, {
                status: 'ticket_sent'
            });

            // Log successful email
            await this.logEmail(ticketDoc, 'sent', null, result.messageId, result.response);

            console.log(`✅ Ticket sent to ${attendee.Name} (${attendee['Email id']}) - ID: ${result.messageId}`);
            this.successCount++;
            
            // Update stats
            await this.updateEventStats({ 
                totalTicketsSent: 1, 
                totalEmailsSent: 1,
                statusBreakdown: { ticket_sent: 1, registered: -1 }
            });
            
            return true;
        } catch (error) {
            // Update ticket with error
            await Ticket.findByIdAndUpdate(ticketDoc._id, {
                emailSent: false,
                emailAttempts: ticketDoc.emailAttempts + 1,
                emailError: error.message
            });

            // Log failed email
            await this.logEmail(ticketDoc, 'failed', error);

            const errorMsg = `Failed to send ticket to ${attendee.Name} (${attendee['Email id']}): ${error.message}`;
            console.error(`❌ ${errorMsg}`);
            this.errors.push(errorMsg);
            this.errorCount++;
            
            // Update stats
            await this.updateEventStats({ totalEmailsFailed: 1 });
            
            return false;
        }
    }

    // Update event statistics
    async updateEventStats(updates) {
        try {
            const incUpdateObj = {};
            const setUpdateObj = { lastUpdated: new Date() };
            
            // Handle simple increments
            for (const [key, value] of Object.entries(updates)) {
                if (key === 'statusBreakdown') {
                    for (const [status, count] of Object.entries(value)) {
                        incUpdateObj[`statusBreakdown.${status}`] = count;
                    }
                } else {
                    incUpdateObj[key] = value;
                }
            }

            const updateQuery = {};
            if (Object.keys(incUpdateObj).length > 0) {
                updateQuery.$inc = incUpdateObj;
            }
            if (Object.keys(setUpdateObj).length > 0) {
                updateQuery.$set = setUpdateObj;
            }

            await EventStats.findOneAndUpdate(
                { eventName: config.event.name },
                updateQuery,
                { upsert: true }
            );
        } catch (error) {
            console.error('❌ Error updating event stats:', error.message);
        }
    }

    // Read CSV and save attendees to database
    async importAttendeesFromCSV() {
        return new Promise((resolve, reject) => {
            const attendees = [];
            
            if (!fs.existsSync(config.csvFile)) {
                reject(new Error(`CSV file not found: ${config.csvFile}`));
                return;
            }

            console.log(`📖 Reading attendees from: ${config.csvFile}`);
            
            fs.createReadStream(config.csvFile)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.Name && row['Email id']) {
                        attendees.push(row);
                    }
                })
                .on('end', async () => {
                    console.log(`👥 Found ${attendees.length} attendees in CSV`);
                    
                    if (attendees.length === 0) {
                        reject(new Error('No valid attendees found in CSV file'));
                        return;
                    }

                    // Save all attendees to database
                    let savedCount = 0;
                    for (const attendeeData of attendees) {
                        try {
                            await this.saveAttendee(attendeeData);
                            savedCount++;
                        } catch (error) {
                            console.error(`❌ Failed to save attendee ${attendeeData.Name}:`, error.message);
                        }
                    }

                    console.log(`💾 Saved ${savedCount} attendees to database`);
                    resolve(attendees);
                })
                .on('error', (error) => {
                    reject(new Error(`Error reading CSV file: ${error.message}`));
                });
        });
    }

    // Send tickets to all attendees in database
    async sendTicketsToAll() {
        try {
            // Get all attendees who don't have tickets sent yet
            const attendees = await Attendee.find({ 
                status: { $in: ['registered'] }
            }).sort({ registrationDate: 1 });

            if (attendees.length === 0) {
                console.log('📭 No attendees found who need tickets');
                return;
            }

            console.log(`🚀 Processing tickets for ${attendees.length} attendees...\\n`);

            for (let i = 0; i < attendees.length; i++) {
                const attendeeDoc = attendees[i];
                
                try {
                    // Check if ticket already exists for this attendee (any status)
                    let ticketDoc = await Ticket.findOne({ attendeeId: attendeeDoc._id });

                    // Create attendee object in CSV format for compatibility
                    const attendee = {
                        Name: attendeeDoc.name,
                        'Email id': attendeeDoc.email,
                        Phone: attendeeDoc.phone,
                        College: attendeeDoc.college,
                        Department: attendeeDoc.department,
                        Year: attendeeDoc.year
                    };

                    if (!ticketDoc) {
                        // Generate new ticket only if none exists
                        const qrData = this.generateQRData(attendee, 'TEMP_ID'); // Temporary, will be replaced
                        ticketDoc = await this.saveTicket(attendee, attendeeDoc, qrData);
                        // Update QR data with actual ticket ID
                        const updatedQrData = this.generateQRData(attendee, ticketDoc.ticketId);
                        await Ticket.findByIdAndUpdate(ticketDoc._id, { qrCodeData: updatedQrData });
                        ticketDoc.qrCodeData = updatedQrData;
                    } else {
                        console.log(`🎫 Using existing ticket ${ticketDoc.ticketId} for ${attendee.Name}`);
                    }

                    // Send email only if not already sent
                    if (!ticketDoc.emailSent) {
                        // Generate QR code buffer for attachment
                        const qrCodeBuffer = await this.generateQRCodeBuffer(ticketDoc.qrCodeData);
                        
                        // Send email
                        await this.sendTicketEmail(attendee, attendeeDoc, ticketDoc, qrCodeBuffer);
                    } else {
                        console.log(`📧 Email already sent for ${attendee.Name} (${ticketDoc.ticketId})`);
                    }
                    
                    // Add delay between processing
                    if (i < attendees.length - 1) {
                        await this.delay(1000);
                    }
                    
                } catch (error) {
                    const errorMsg = `Failed to process ticket for ${attendeeDoc.name}: ${error.message}`;
                    console.error(`❌ ${errorMsg}`);
                    this.errors.push(errorMsg);
                    this.errorCount++;
                }
            }

        } catch (error) {
            console.error('❌ Error in sendTicketsToAll:', error.message);
            throw error;
        }
    }

    // Helper function to add delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get database statistics
    async getDatabaseStats() {
        try {
            const stats = await EventStats.findOne({ eventName: config.event.name });
            const attendeeCount = await Attendee.countDocuments();
            const ticketCount = await Ticket.countDocuments();
            const emailLogCount = await EmailLog.countDocuments();
            
            return {
                eventStats: stats,
                totalAttendees: attendeeCount,
                totalTickets: ticketCount,
                totalEmailLogs: emailLogCount
            };
        } catch (error) {
            console.error('❌ Error getting database stats:', error.message);
            return null;
        }
    }

    // Print comprehensive summary report
    async printSummary() {
        console.log('\\n' + '='.repeat(60));
        console.log('📊 TICKET SENDING SUMMARY (MongoDB Edition)');
        console.log('='.repeat(60));
        
        // Current session stats
        console.log(`✅ Successfully sent (this session): ${this.successCount} tickets`);
        console.log(`❌ Failed to send (this session): ${this.errorCount} tickets`);
        console.log(`📧 Total processed (this session): ${this.successCount + this.errorCount} attendees`);
        
        // Database stats
        const dbStats = await this.getDatabaseStats();
        if (dbStats && dbStats.eventStats) {
            console.log('\\n📊 OVERALL EVENT STATISTICS:');
            console.log(`👥 Total Registrations: ${dbStats.eventStats.totalRegistrations}`);
            console.log(`🎫 Total Tickets Sent: ${dbStats.eventStats.totalTicketsSent}`);
            console.log(`📧 Total Emails Sent: ${dbStats.eventStats.totalEmailsSent}`);
            console.log(`❌ Total Email Failures: ${dbStats.eventStats.totalEmailsFailed}`);
            
            if (dbStats.eventStats.statusBreakdown) {
                console.log('\\n📈 STATUS BREAKDOWN:');
                console.log(`   Registered: ${dbStats.eventStats.statusBreakdown.registered}`);
                console.log(`   Tickets Sent: ${dbStats.eventStats.statusBreakdown.ticket_sent}`);
                console.log(`   Attended: ${dbStats.eventStats.statusBreakdown.attended}`);
                console.log(`   Cancelled: ${dbStats.eventStats.statusBreakdown.cancelled}`);
            }
        }
        
        if (this.errors.length > 0) {
            console.log('\\n❌ ERRORS (This Session):');
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        console.log('\\n🎉 Ticket sending process completed!');
        console.log('💾 All data has been saved to MongoDB database');
    }

    // Test email configuration
    async testEmailConfig() {
        console.log('🧪 Testing email configuration...');
        
        try {
            await this.transporter.verify();
            console.log('✅ Email configuration test passed!');
            return true;
        } catch (error) {
            console.error('❌ Email configuration test failed:', error.message);
            console.log('\\n💡 Please check:');
            console.log('1. Email credentials in .env file');
            console.log('2. SMTP server settings');
            console.log('3. Network connectivity');
            return false;
        }
    }

    // Cleanup and disconnect
    async cleanup() {
        try {
            if (this.dbConnected) {
                await database.disconnect();
                console.log('🔌 Database disconnected');
            }
        } catch (error) {
            console.error('❌ Error during cleanup:', error.message);
        }
    }
}

// Main execution function
async function main() {
    console.log('🎫 SHAKTI Event Ticket Sender (MongoDB Edition)');
    console.log('===============================================\\n');

    const ticketSender = new TicketSenderMongoDB();

    try {
        // Initialize database
        const dbReady = await ticketSender.initDatabase();
        if (!dbReady) {
            console.log('\\n💡 Please check your MongoDB connection and try again.');
            process.exit(1);
        }

        // Initialize email transporter
        const transporterReady = await ticketSender.initTransporter();
        if (!transporterReady) {
            console.log('\\n💡 Please update your email password in the .env file and try again.');
            process.exit(1);
        }

        // Test email configuration
        const configValid = await ticketSender.testEmailConfig();
        if (!configValid) {
            process.exit(1);
        }

        // Import attendees from CSV if needed
        console.log('\\n📥 Importing attendees from CSV...');
        await ticketSender.importAttendeesFromCSV();

        // Send tickets to all attendees
        console.log('\\n🚀 Processing tickets...');
        await ticketSender.sendTicketsToAll();

        // Print summary
        await ticketSender.printSummary();

    } catch (error) {
        console.error('💥 Fatal error:', error.message);
        process.exit(1);
    } finally {
        await ticketSender.cleanup();
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\\n\\n⏹️  Process interrupted by user');
    process.exit(0);
});

// Export for testing
module.exports = { TicketSenderMongoDB };

// Run the script if called directly
if (require.main === module) {
    main();
}