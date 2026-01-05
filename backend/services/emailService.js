import transporter from '../config/nodemailer.js'
import { generateTicketNumber, generateQRCodeBuffer, generateTicketHTML } from './ticketService.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Registration Success Email Template
const generateRegistrationSuccessEmail = (registrationData) => {
  // Convert Mongoose document to plain object if needed
  const regData = registrationData.toObject ? registrationData.toObject() : registrationData
  const { name, email, college, year, amount, _id, createdAt } = regData

  return {
    subject: 'Registration Confirmed - ACD 2025',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
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
            
            <p><strong>Note:</strong> You will receive a separate email shortly containing your E-Ticket and QR Code for entry.</p>

            <div class="event-info">
              <h3>🎪 Event Information</h3>
              <p><strong>Event:</strong> ACD 2025</p>
              <p><strong>Dates:</strong> January 29-30, 2026</p>
              <p><strong>Venue:</strong> Will be announced soon</p>
              <p><strong>Time:</strong> 9:00 AM onwards</p>
            </div>
            
            <div class="details">
              <h3>Registration Details</h3>
              <div class="detail-row">
                <span class="label">Registration ID:</span>
                <span class="value">${_id}</span>
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
Name: ${name}
Email: ${email}
College: ${college}
Year: ${year}
Amount Paid: ₹${amount}
Registration Date: ${new Date(createdAt).toLocaleString('en-IN')}

Note: You will receive a separate email shortly containing your E-Ticket and QR Code for entry.

Thank you for registering for ACD 2025!

Event Organization Team
    `
  }
}

// E-Ticket Email Template
const generateTicketEmail = async (registrationData) => {
  // Convert Mongoose document to plain object if needed
  const regData = registrationData.toObject ? registrationData.toObject() : registrationData
  const { name, email, _id, college, year, amount } = regData

  // Generate ticket number and QR code buffer
  const ticketNumber = generateTicketNumber()
  const qrCodeBuffer = await generateQRCodeBuffer({
    ticketNumber,
    registrationId: _id,
    name,
    email
  })

  // Generate ticket HTML (now uses CID reference) with all required fields
  const ticketHTML = generateTicketHTML({
    name,
    email,
    college,
    year,
    amount,
    _id,
    ticketNumber
  })

  return {
    ticketNumber,
    qrCodeBuffer,
    subject: 'Your E-Ticket - ACD 2026',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ACD 2026 E-Ticket</title>
      </head>
      <body style="margin: 0; padding: 0;">
        ${ticketHTML}
      </body>
      </html>
    `,
    text: `
ACD 2026 E-Ticket

Dear ${name},

Your E-Ticket for ACD 2026

Ticket Number: ${ticketNumber}
Name: ${name}
Event: ACD 2026 - Annual Cultural Day
Date: January 29-30, 2026
Time: 9:00 AM Onwards
Location: Auditorium

Please show this ticket at the venue entry.

Event Organization Team
    `
  }
}

// Helper function to send email with retry logic
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Sending email (attempt ${attempt}/${maxRetries})...`);
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      lastError = error;
      console.error(`❌ Email attempt ${attempt} failed:`, error.message);

      // Don't retry on certain errors
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        throw error; // Authentication errors won't be fixed by retrying
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
};

// Function to send confirmation emails
export const sendConfirmationEmail = async (registrationData) => {
  try {
    const fromAddress = 'ACD 2025 Event <' + (process.env.EMAIL_FROM || 'noreply@acesmitadt.com') + '>'

    // 1. Send Registration Success Email
    const regEmail = generateRegistrationSuccessEmail(registrationData)
    const regInfo = await sendEmailWithRetry({
      from: fromAddress,
      to: registrationData.email,
      subject: regEmail.subject,
      html: regEmail.html,
      text: regEmail.text
    })
    console.log('✅ Registration confirmation email sent:', regInfo.messageId)

    // Small delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Send Ticket Email
    const ticketEmail = await generateTicketEmail(registrationData)
    const ticketInfo = await sendEmailWithRetry({
      from: fromAddress,
      to: registrationData.email,
      subject: ticketEmail.subject,
      html: ticketEmail.html,
      text: ticketEmail.text,
      attachments: [
        {
          filename: `ACD-2025-Ticket-${ticketEmail.ticketNumber}.png`,
          content: ticketEmail.qrCodeBuffer,
          contentType: 'image/png',
          cid: 'ticket-qr-code'
        },
        {
          filename: 'ACES_LOGO.png',
          path: path.join(__dirname, '../../public/ACES_LOGO-.png'),
          contentType: 'image/png',
          cid: 'aces-logo'
        }
      ]
    })
    console.log('✅ Ticket email sent:', ticketInfo.messageId)

    // Return ticket information for database update
    return {
      success: true,
      messageId: ticketInfo.messageId, // Returning ticket email ID mostly for reference
      ticketNumber: ticketEmail.ticketNumber,
      qrCode: ticketEmail.qrCodeBuffer.toString('base64')
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return { success: false, error: error.message }
  }
}

// Function to send test email
export const sendTestEmail = async (email) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Event Registration <noreply@event.com>',
      to: email,
      subject: 'Test Email - Event Registration System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>This is a test email from the Event Registration System.</p>
          <p>If you received this email, the email configuration is working correctly!</p>
          <p>Timestamp: ${new Date().toLocaleString('en-IN')}</p>
        </div>
      `,
      text: `Test Email - Event Registration System
      
This is a test email from the Event Registration System.
If you received this email, the email configuration is working correctly!

Timestamp: ${new Date().toLocaleString('en-IN')}`
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Test email failed:', error)
    return { success: false, error: error.message }
  }
}

// Function to send bulk notifications
export const sendBulkNotification = async (recipients, subject, message) => {
  try {
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    }

    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 10
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)

      // Process batch in parallel
      const batchPromises = batch.map(async (recipient) => {
        try {
          const personalizedMessage = message.replace(/\{name\}/g, recipient.name)

          const mailOptions = {
            from: 'ACD 2025 Event <' + (process.env.EMAIL_FROM || 'noreply@acesmitadt.com') + '>',
            to: recipient.email,
            subject: subject,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .message { background: white; padding: 20px; border-radius: 8px; white-space: pre-line; }
                  .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎪 ACD 2025</h1>
                    <p>${subject}</p>
                  </div>
                  
                  <div class="content">
                    <div class="message">
                      ${personalizedMessage}
                    </div>
                    
                    <div class="footer">
                      <p>Best regards,<br/>ACD 2025 Team</p>
                      <p><small>This is an automated message. Please do not reply to this email.</small></p>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `,
            text: `${subject}\n\n${personalizedMessage}\n\nBest regards,\nACD 2025 Team`
          }

          const info = await transporter.sendMail(mailOptions)
          console.log(`✅ Bulk email sent to ${recipient.email}:`, info.messageId)
          results.sent++

        } catch (error) {
          console.error(`❌ Failed to send email to ${recipient.email}:`, error.message)
          results.failed++
          results.errors.push({
            email: recipient.email,
            error: error.message
          })
        }
      })

      // Wait for batch to complete before processing next batch
      await Promise.all(batchPromises)

      // Small delay between batches to be respectful to email service
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`📊 Bulk email results: ${results.sent} sent, ${results.failed} failed`)
    return {
      success: true,
      sent: results.sent,
      failed: results.failed,
      total: recipients.length,
      errors: results.errors
    }

  } catch (error) {
    console.error('❌ Bulk email sending failed:', error)
    return {
      success: false,
      error: error.message,
      sent: 0,
      failed: recipients.length,
      total: recipients.length
    }
  }
}