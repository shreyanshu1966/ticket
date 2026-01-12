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
              <p><strong>Dates:</strong> January 28-29, 2026</p>
              <p><strong>Venue:</strong> Urmilatai Karad Auditorium, MIT ADT Pune</p>
              <p><strong>Time:</strong> 8:00 PM to 5:00 PM</p>
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
                <span class="value">₹${amount / 100}</span>
              </div>
              <div class="detail-row">
                <span class="label">Registration Date:</span>
                <span class="value">${new Date(createdAt).toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing ACD 2025!</p>
              <p><strong>Event Organization Team</strong></p>
              
              <div style="background: #f0f7ff; border: 1px solid #667eea; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #667eea;">📞 For Queries, Contact:</h4>
                <p style="margin: 5px 0; color: #333;">
                  <strong>Aayush:</strong> <a href="tel:+919226750350" style="color: #667eea; text-decoration: none;">9226750350</a>
                </p>
                <p style="margin: 5px 0; color: #333;">
                  <strong>Ishan:</strong> <a href="tel:+919552448038" style="color: #667eea; text-decoration: none;">9552448038</a>
                </p>
              </div>
              
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
- Dates: January 28-29, 2026
- Venue: Urmilatai Karad Auditorium, MIT ADT Pune
- Time: 8:00 PM to 5:00 PM

REGISTRATION DETAILS:
Registration ID: ${_id}
Name: ${name}
Email: ${email}
College: ${college}
Year: ${year}
Amount Paid: ₹${amount / 100}
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
Event: ACD 2026 - ACES Community Day
Date: January 28-29, 2026
Time: 8:00 PM to 5:00 PM
Location: Urmilatai Karad Auditorium, MIT ADT Pune

Please show this ticket at the venue entry.

Event Organization Team
    `
  }
}



// Pending Payment Email Template - Professional Design (Matching Ticket Style)
const generatePendingPaymentEmail = (registrationData) => {
  const regData = registrationData.toObject ? registrationData.toObject() : registrationData
  const { name, email, college, year, amount, _id, createdAt } = regData

  // Calculate time remaining for early bird offer (48 hours from registration)
  const registrationTime = new Date(createdAt)
  const offerEndTime = new Date(registrationTime.getTime() + (48 * 60 * 60 * 1000))
  const timeRemaining = Math.max(0, Math.floor((offerEndTime - new Date()) / (1000 * 60 * 60)))

  return {
    subject: '⏰ Complete Your Registration - Early Bird Offer Active | ACD 2025',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your Registration - ACD 2025</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="width: 100%; background-color: #f3f4f6; padding: 20px 10px;">
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background-color: #1a1a1a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); color: white; border: 1px solid #374151;">
            
            <!-- Header Section -->
            <div style="padding: 20px; background-color: #1a1a1a;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50" valign="middle">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #9333ea, #2563eb); border-radius: 10px; padding: 2px;">
                      <div style="background: #1a1a1a; width: 100%; height: 100%; border-radius: 8px; text-align: center; line-height: 36px;">
                        <span style="font-size: 24px;">🎫</span>
                      </div>
                    </div>
                  </td>
                  <td valign="middle" style="padding-left: 12px;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: white; line-height: 1.2;">ACD 2026</h1>
                    <p style="margin: 0; color: #a855f7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">ACES Community Day</p>
                  </td>
                  <td align="right" valign="top">
                    <span style="background-color: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 20px; padding: 4px 10px; color: #fbbf24; font-size: 9px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; display: inline-block; white-space: nowrap;">Early Bird</span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Main Content -->
            <div style="padding: 30px 20px; background-color: #1a1a1a; border-top: 1px solid #374151;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #d1d5db; font-size: 15px;">Dear <strong style="color: white;">${name}</strong>,</p>
              
              <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                Thank you for initiating your registration for <strong style="color: #c084fc;">ACD 2025</strong>. We're excited to have you join us for this premier community event.
              </p>

              <!-- Early Bird Offer Box -->
              <div style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%); border: 1px solid rgba(234, 179, 8, 0.2); border-radius: 12px; padding: 20px; margin: 25px 0;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align: top; width: 40px;">
                      <div style="width: 36px; height: 36px; background: rgba(234, 179, 8, 0.2); border-radius: 50%; text-align: center; line-height: 36px; font-size: 20px;">⚡</div>
                    </td>
                    <td style="padding-left: 15px;">
                      <h3 style="margin: 0 0 8px 0; color: #fbbf24; font-size: 16px; font-weight: 600;">Early Bird Pricing Active</h3>
                      <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 1.5;">
                        Complete your payment within <strong style="color: #fbbf24;">${timeRemaining} hours</strong> to secure this exclusive rate. Limited slots available.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Countdown Timer -->
              <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; color: rgba(255,255,255,0.8); font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Offer Expires In</p>
                <div style="font-size: 48px; font-weight: bold; color: white; margin: 10px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${timeRemaining}</div>
                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Hours Remaining</p>
              </div>

              <!-- Pricing Comparison -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
                <tr>
                  <td width="50%" style="padding-right: 10px; vertical-align: top;">
                    <div style="background: #151515; border: 1px solid #374151; border-radius: 10px; padding: 20px; text-align: center;">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Regular Price</p>
                      <div style="text-decoration: line-through; color: #6b7280; font-size: 24px; font-weight: bold;">₹${Math.floor((amount / 100) * 1.5)}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 10px; vertical-align: top;">
                    <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%); border: 2px solid #22c55e; border-radius: 10px; padding: 20px; text-align: center;">
                      <p style="margin: 0 0 8px 0; color: #4ade80; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Early Bird Price</p>
                      <div style="color: #22c55e; font-size: 32px; font-weight: bold;">₹${amount / 100}</div>
                      <div style="background: #22c55e; color: #000; padding: 4px 12px; border-radius: 12px; display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 700;">SAVE ₹${Math.floor((amount / 100) * 0.5)}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://acd.acesmitadt.com'}/payment/${_id}" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #2563eb); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(147, 51, 234, 0.4);">
                  Complete Payment Now
                </a>
                <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 11px;">Secure UPI Payment</p>
              </div>

              <!-- Registration Details -->
              <div style="background: #151515; border: 1px solid #374151; border-radius: 10px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 16px 0; color: #d1d5db; font-size: 15px; font-weight: 600;">Your Registration Details</h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #6b7280; font-size: 12px;">Registration ID</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #d1d5db; font-size: 12px; font-family: monospace;">${_id.toString().slice(0, 12)}...</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #6b7280; font-size: 12px;">Name</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #d1d5db; font-size: 12px;">${name}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #6b7280; font-size: 12px;">College</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #d1d5db; font-size: 12px;">${college}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #6b7280; font-size: 12px;">Year</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #d1d5db; font-size: 12px;">${year}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #6b7280; font-size: 12px;">Amount to Pay</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <span style="color: #22c55e; font-size: 16px; font-weight: bold;">₹${amount / 100}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Event Information -->
              <div style="background: rgba(37, 99, 235, 0.1); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 10px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 15px; font-weight: 600;">📅 Event Information</h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 6px 0;">
                      <span style="color: #9ca3af; font-size: 12px;">Event:</span>
                    </td>
                    <td align="right" style="padding: 6px 0;">
                      <span style="color: #d1d5db; font-size: 12px; font-weight: 500;">ACD 2025 - ACES Community Day</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0;">
                      <span style="color: #9ca3af; font-size: 12px;">Dates:</span>
                    </td>
                    <td align="right" style="padding: 6px 0;">
                      <span style="color: #d1d5db; font-size: 12px; font-weight: 500;">January 28-29, 2026</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0;">
                      <span style="color: #9ca3af; font-size: 12px;">Time:</span>
                    </td>
                    <td align="right" style="padding: 6px 0;">
                      <span style="color: #d1d5db; font-size: 12px; font-weight: 500;">8:00 PM - 5:00 PM</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0;">
                      <span style="color: #9ca3af; font-size: 12px;">Venue:</span>
                    </td>
                    <td align="right" style="padding: 6px 0;">
                      <span style="color: #d1d5db; font-size: 12px; font-weight: 500;">Urmilatai Karad Auditorium, MIT ADT Pune</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Important Notice -->
              <div style="background: rgba(234, 88, 12, 0.1); border-left: 3px solid #ea580c; border-radius: 8px; padding: 16px; margin: 25px 0;">
                <p style="margin: 0 0 8px 0; color: #fb923c; font-size: 13px; font-weight: 600;">⚠️ Important</p>
                <p style="margin: 0; color: #d1d5db; font-size: 12px; line-height: 1.6;">
                  Your registration will be confirmed only after successful payment completion. Early bird pricing is subject to availability and time constraints.
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="background: #151515; padding: 25px 20px; text-align: center; border-top: 1px solid #374151;">
              <div style="background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.2); border-radius: 8px; padding: 16px; margin: 0 0 20px 0;">
                <p style="margin: 0 0 10px 0; color: #a5b4fc; font-size: 12px; font-weight: 600;">📞 Need Assistance?</p>
                <p style="margin: 5px 0; color: #d1d5db; font-size: 12px;">
                  <strong>Aayush:</strong> <a href="tel:+919226750350" style="color: #818cf8; text-decoration: none;">9226750350</a>
                </p>
                <p style="margin: 5px 0; color: #d1d5db; font-size: 12px;">
                  <strong>Ishan:</strong> <a href="tel:+919552448038" style="color: #818cf8; text-decoration: none;">9552448038</a>
                </p>
              </div>
              
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 13px;">Thank you for choosing ACD 2025</p>
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 12px; font-weight: 600;">ACES Event Organization Team</p>
              
              <p style="margin: 0; color: #6b7280; font-size: 11px;">This is an automated email. For support, contact mail@acesmitadt.com</p>
            </div>

            <!-- Bottom Color Bar -->
            <div style="height: 5px; background: linear-gradient(90deg, #9333ea, #2563eb); width: 100%;"></div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
ACD 2025 - Complete Your Registration

Dear ${name},

Thank you for initiating your registration for ACD 2025. We're excited to have you join us for this premier community event.

⚡ EARLY BIRD PRICING ACTIVE
Complete your payment within ${timeRemaining} hours to secure this exclusive rate.

OFFER EXPIRES IN: ${timeRemaining} HOURS

PRICING:
Regular Price: ₹${Math.floor((amount / 100) * 1.5)} (crossed out)
Early Bird Price: ₹${amount / 100}
YOU SAVE: ₹${Math.floor((amount / 100) * 0.5)}

YOUR REGISTRATION DETAILS:
Registration ID: ${_id}
Name: ${name}
College: ${college}
Year: ${year}
Amount to Pay: ₹${amount / 100}

EVENT INFORMATION:
Event: ACD 2025 - ACES Community Day
Dates: January 28-29, 2026
Time: 8:00 PM - 5:00 PM
Venue: Urmilatai Karad Auditorium, MIT ADT Pune

⚠️ IMPORTANT:
Your registration will be confirmed only after successful payment completion. Early bird pricing is subject to availability and time constraints.

Complete your payment here: ${process.env.FRONTEND_URL || 'https://acd.acesmitadt.com'}/payment/${_id}

NEED ASSISTANCE?
Aayush: 9226750350
Ishan: 9552448038
Email: mail@acesmitadt.com

Thank you for choosing ACD 2025
ACES Event Organization Team

This is an automated email. For support, contact mail@acesmitadt.com
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
    // Check if emails were already sent for this registration
    if (registrationData.ticketGenerated && registrationData.emailSentAt) {
      console.log('⚠️ Emails already sent for registration:', registrationData._id)
      return {
        success: true,
        message: 'Emails already sent',
        ticketNumber: registrationData.ticketNumber,
        qrCode: registrationData.qrCode,
        alreadySent: true
      }
    }

    const fromAddress = 'ACD 2025 Event <' + (process.env.EMAIL_FROM || 'noreply@acesmitadt.com') + '>'

    // 1. Send Registration Success Email
    console.log('📧 Sending registration confirmation email...')
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
    console.log('🎫 Sending ticket email...')
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

// Function to send pending payment reminder email
export const sendPendingPaymentEmail = async (registrationData) => {
  try {
    const fromAddress = 'ACD 2025 Event <' + (process.env.EMAIL_FROM || 'noreply@acesmitadt.com') + '>'

    console.log('📧 Sending pending payment reminder email...')
    const pendingEmail = generatePendingPaymentEmail(registrationData)

    const info = await sendEmailWithRetry({
      from: fromAddress,
      to: registrationData.email,
      subject: pendingEmail.subject,
      html: pendingEmail.html,
      text: pendingEmail.text
    })

    console.log('✅ Pending payment email sent:', info.messageId)

    return {
      success: true,
      messageId: info.messageId
    }
  } catch (error) {
    console.error('❌ Pending payment email failed:', error)
    return { success: false, error: error.message }
  }
}