// send-tickets.js - Main script to send tickets with QR codes
const nodemailer = require('nodemailer');
const csv = require('csv-parser');
const fs = require('fs');
const QRCode = require('qrcode');
const config = require('./config');
const { generateTicketTemplate } = require('./email-template');

class TicketSender {
    constructor() {
        this.transporter = null;
        this.successCount = 0;
        this.errorCount = 0;
        this.errors = [];
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
                    rejectUnauthorized: false, // For self-signed certificates
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

    // Generate unique ticket ID
    generateTicketId(attendee, index) {
        const timestamp = Date.now().toString().slice(-6);
        const nameCode = attendee.Name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
        return `${config.qr.ticketPrefix}-${nameCode}${timestamp}-${String(index).padStart(3, '0')}`;
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
                width: config.qr.size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            // Remove data URL prefix to get base64 string
            return qrCodeDataURL.split(',')[1];
        } catch (error) {
            console.error('❌ Error generating QR code:', error);
            throw error;
        }
    }

    // Send email to individual attendee
    async sendTicketEmail(attendee, ticketId, qrCodeBase64) {
        try {
            const htmlContent = generateTicketTemplate(attendee, qrCodeBase64, ticketId);
            
            const mailOptions = {
                from: `"${config.sender.name}" <${config.sender.email}>`,
                to: attendee['Email id'],
                subject: `🎫 Your ${config.event.name} Event Ticket - ${ticketId}`,
                html: htmlContent,
                attachments: [
                    {
                        filename: `${config.event.name}-ticket-${ticketId}.png`,
                        content: qrCodeBase64,
                        encoding: 'base64',
                        cid: 'qrcode'
                    }
                ]
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Ticket sent to ${attendee.Name} (${attendee['Email id']})`);
            this.successCount++;
            return true;
        } catch (error) {
            const errorMsg = `Failed to send ticket to ${attendee.Name} (${attendee['Email id']}): ${error.message}`;
            console.error(`❌ ${errorMsg}`);
            this.errors.push(errorMsg);
            this.errorCount++;
            return false;
        }
    }

    // Read CSV and send tickets to all attendees
    async sendTicketsToAll() {
        return new Promise((resolve, reject) => {
            const attendees = [];
            
            // Check if CSV file exists
            if (!fs.existsSync(config.csvFile)) {
                reject(new Error(`CSV file not found: ${config.csvFile}`));
                return;
            }

            console.log(`📖 Reading attendees from: ${config.csvFile}`);
            
            fs.createReadStream(config.csvFile)
                .pipe(csv())
                .on('data', (row) => {
                    // Clean up the data and validate required fields
                    if (row.Name && row['Email id']) {
                        attendees.push(row);
                    }
                })
                .on('end', async () => {
                    console.log(`👥 Found ${attendees.length} attendees`);
                    
                    if (attendees.length === 0) {
                        reject(new Error('No valid attendees found in CSV file'));
                        return;
                    }

                    console.log('\n🚀 Starting to send tickets...\n');

                    // Process attendees with a delay to avoid overwhelming the email server
                    for (let i = 0; i < attendees.length; i++) {
                        const attendee = attendees[i];
                        
                        try {
                            // Generate unique ticket ID
                            const ticketId = this.generateTicketId(attendee, i + 1);
                            
                            // Generate QR code data
                            const qrData = this.generateQRData(attendee, ticketId);
                            
                            // Generate QR code image
                            const qrCodeBase64 = await this.generateQRCode(qrData);
                            
                            // Send email
                            await this.sendTicketEmail(attendee, ticketId, qrCodeBase64);
                            
                            // Add delay between emails (1 second)
                            if (i < attendees.length - 1) {
                                await this.delay(1000);
                            }
                            
                        } catch (error) {
                            const errorMsg = `Failed to process ticket for ${attendee.Name}: ${error.message}`;
                            console.error(`❌ ${errorMsg}`);
                            this.errors.push(errorMsg);
                            this.errorCount++;
                        }
                    }

                    resolve();
                })
                .on('error', (error) => {
                    reject(new Error(`Error reading CSV file: ${error.message}`));
                });
        });
    }

    // Helper function to add delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Print summary report
    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 TICKET SENDING SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Successfully sent: ${this.successCount} tickets`);
        console.log(`❌ Failed to send: ${this.errorCount} tickets`);
        console.log(`📧 Total processed: ${this.successCount + this.errorCount} attendees`);
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        console.log('\n🎉 Ticket sending process completed!');
    }

    // Test email configuration
    async testEmailConfig() {
        console.log('🧪 Testing email configuration...');
        
        try {
            // Just verify without extra logging to avoid SSL timing issues
            await this.transporter.verify();
            console.log('✅ Email configuration test passed!');
            return true;
        } catch (error) {
            console.error('❌ Email configuration test failed:', error.message);
            
            // Try alternative configuration if initial test fails
            console.log('🔄 Trying alternative configuration...');
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
                
                await this.transporter.verify();
                console.log('✅ Alternative configuration works!');
                return true;
            } catch (altError) {
                console.log('\n💡 Please check:');
                console.log('1. Email credentials in .env file');
                console.log('2. SMTP server settings');
                console.log('3. Network connectivity');
                return false;
            }
        }
    }
}

// Main execution function
async function main() {
    console.log('🎫 SHAKTI Event Ticket Sender');
    console.log('===============================\n');

    const ticketSender = new TicketSender();

    try {
        // Initialize email transporter
        const transporterReady = await ticketSender.initTransporter();
        if (!transporterReady) {
            console.log('\n💡 Please update your email password in the .env file and try again.');
            process.exit(1);
        }

        // Test email configuration
        const configValid = await ticketSender.testEmailConfig();
        if (!configValid) {
            process.exit(1);
        }

        // Send tickets to all attendees
        await ticketSender.sendTicketsToAll();

        // Print summary
        ticketSender.printSummary();

    } catch (error) {
        console.error('💥 Fatal error:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n⏹️  Process interrupted by user');
    process.exit(0);
});

// Export for testing
module.exports = { TicketSender };

// Run the script if called directly
if (require.main === module) {
    main();
}