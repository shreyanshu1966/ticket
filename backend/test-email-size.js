import dotenv from 'dotenv'
import { generateTicketNumber, generateQRCode, generateTicketHTML } from './services/ticketService.js'
import { sendConfirmationEmail } from './services/emailService.js'

// Load environment variables
dotenv.config()

// Sample registration data for testing
const sampleRegistration = {
  _id: '677a1b2c3d4e5f6789012345',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+91 9876543210',
  college: 'Test University',
  year: 'Final Year',
  amount: 199,
  createdAt: new Date(),
  paymentStatus: 'completed'
}

async function testEmailGeneration() {
  console.log('🧪 Testing Email Generation and Size...\n')
  
  try {
    // Generate ticket components
    console.log('1. Generating ticket number...')
    const ticketNumber = generateTicketNumber()
    console.log(`   Ticket Number: ${ticketNumber}`)
    
    console.log('2. Generating QR code...')
    const qrData = {
      ticketNumber,
      registrationId: sampleRegistration._id,
      name: sampleRegistration.name,
      email: sampleRegistration.email
    }
    const qrCodeDataUrl = await generateQRCode(qrData)
    console.log(`   QR Code Size: ${Math.round(qrCodeDataUrl.length / 1024)} KB`)
    console.log(`   QR Code Preview: ${qrCodeDataUrl.substring(0, 50)}...`)
    
    console.log('3. Generating ticket HTML...')
    const ticketHTML = generateTicketHTML({
      ...sampleRegistration,
      ticketNumber
    }, qrCodeDataUrl)
    console.log(`   Ticket HTML Size: ${Math.round(ticketHTML.length / 1024)} KB`)
    
    // Create email content (without actually sending)
    console.log('4. Generating email content...')
    const emailContent = await generateEmailContent(sampleRegistration, ticketNumber, qrCodeDataUrl, ticketHTML)
    
    // Calculate sizes
    const htmlSize = Buffer.byteLength(emailContent.html, 'utf8')
    const textSize = Buffer.byteLength(emailContent.text, 'utf8')
    
    console.log('\n📧 Email Size Analysis:')
    console.log(`   HTML Content: ${Math.round(htmlSize / 1024)} KB`)
    console.log(`   Text Content: ${Math.round(textSize / 1024)} KB`)
    console.log(`   Total Email Size: ${Math.round((htmlSize + textSize) / 1024)} KB`)
    
    // Check if size is within reasonable limits
    const maxEmailSize = 10 * 1024 * 1024 // 10MB limit for most email providers
    const isWithinLimit = htmlSize < maxEmailSize
    
    console.log(`\n✅ Size Check:`)
    console.log(`   Within Email Provider Limits: ${isWithinLimit ? 'YES' : 'NO'}`)
    console.log(`   Gmail Limit (25MB): ${htmlSize < 25 * 1024 * 1024 ? 'OK' : 'EXCEEDED'}`)
    console.log(`   Outlook Limit (20MB): ${htmlSize < 20 * 1024 * 1024 ? 'OK' : 'EXCEEDED'}`)
    
    // Show QR code embedding status
    console.log(`\n🔍 QR Code Analysis:`)
    console.log(`   QR Code Format: ${qrCodeDataUrl.includes('data:image/png') ? 'PNG Data URL' : 'Unknown'}`)
    console.log(`   Properly Embedded: ${emailContent.html.includes(qrCodeDataUrl) ? 'YES' : 'NO'}`)
    
    // Save sample email for inspection
    console.log('\n💾 Saving sample email files...')
    const fs = await import('fs')
    await fs.promises.writeFile('./sample-email.html', emailContent.html)
    await fs.promises.writeFile('./sample-email.txt', emailContent.text)
    await fs.promises.writeFile('./sample-qr.txt', qrCodeDataUrl)
    console.log('   Files saved: sample-email.html, sample-email.txt, sample-qr.txt')
    
  } catch (error) {
    console.error('❌ Error testing email generation:', error)
  }
}

// Helper function to generate email content without sending
async function generateEmailContent(registrationData, ticketNumber, qrCode, ticketHTML) {
  const { name, email, college, year, amount, _id, createdAt } = registrationData
  
  return {
    subject: 'ACD 2025 Event Registration Confirmation & E-Ticket',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .success-badge { background: #10B981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .event-info { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
            <p>Welcome to ACD 2025</p>
          </div>
          
          <div class="content">
            <div class="success-badge">✅ Payment Successful</div>
            
            <p>Dear <strong>${name}</strong>,</p>
            
            <p>Thank you for registering for ACD 2025! Your payment has been successfully processed and your registration is now confirmed.</p>
            
            <div class="event-info">
              <h3>🎪 Event Information</h3>
              <p><strong>Event:</strong> ACD 2025</p>
              <p><strong>Dates:</strong> January 29-30, 2026</p>
              <p><strong>Venue:</strong> Will be announced soon</p>
              <p><strong>Time:</strong> 9:00 AM onwards</p>
              <p><strong>Entry:</strong> Show your e-ticket below at the venue</p>
            </div>
            
            <div class="details">
              <h3>Registration Details</h3>
              <div class="detail-row">
                <span class="label">Registration ID:</span>
                <span class="value">${_id}</span>
              </div>
              <div class="detail-row">
                <span class="label">Ticket Number:</span>
                <span class="value">${ticketNumber}</span>
              </div>
              <div class="detail-row">
                <span class="label">Name:</span>
                <span class="value">${name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email:</span>
                <span class="value">${email}</span>
              </div>
              <div class="detail-row">
                <span class="label">College/University:</span>
                <span class="value">${college}</span>
              </div>
              <div class="detail-row">
                <span class="label">Year/Level:</span>
                <span class="value">${year}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount Paid:</span>
                <span class="value">₹${amount}</span>
              </div>
              <div class="detail-row">
                <span class="label">Registration Date:</span>
                <span class="value">${new Date(createdAt).toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <h2 style="text-align: center; color: #667eea;">🎫 Your E-Ticket</h2>
            <div style="text-align: center;">
              ${ticketHTML}
            </div>
            
            <h3>Important Instructions:</h3>
            <ul>
              <li><strong>Save this email</strong> - It contains your entry ticket</li>
              <li><strong>Show the QR code</strong> at the venue for entry</li>
              <li><strong>Arrive early</strong> - Entry starts at 9:00 AM</li>
              <li><strong>Bring valid ID</strong> for verification</li>
              <li><strong>Don't share your ticket</strong> - Each ticket is unique</li>
            </ul>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #856404;">📱 Entry Process:</h4>
              <p style="margin-bottom: 0; color: #856404;">1. Show this email with QR code at entry gate<br>
              2. Our team will scan your QR code<br>
              3. Your details will be verified<br>
              4. Entry will be confirmed!</p>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing ACD 2025!</p>
              <p><strong>Event Organization Team</strong></p>
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>For support, contact us at mail@acesmitadt.com</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
ACD 2025 Event Registration Confirmation

Dear ${name},

Your registration has been confirmed! Here are your details:

EVENT INFORMATION:
- Event: ACD 2025
- Dates: January 29-30, 2026
- Venue: Will be announced soon
- Time: 9:00 AM onwards

REGISTRATION DETAILS:
Registration ID: ${_id}
Ticket Number: ${ticketNumber}
Name: ${name}
Email: ${email}
College: ${college}
Year: ${year}
Amount Paid: ₹${amount}
Registration Date: ${new Date(createdAt).toLocaleString('en-IN')}

IMPORTANT: Show this email with QR code at the venue for entry.

Thank you for registering for ACD 2025!

Event Organization Team
    `
  }
}

// Run the test
testEmailGeneration().catch(console.error)