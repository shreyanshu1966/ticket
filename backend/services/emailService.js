import transporter, { noreplyTransporter, otpTransporter } from '../config/nodemailer.js'
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
    subject: 'Registration Confirmed - ACD 2026',
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
            <p>Welcome to ACD 2026</p>
          </div>
          
          <div class="content">
            <div class="success-badge">✅ Payment Successful</div>
            
            <p>Dear <strong>${name}</strong>,</p>
            
            <p>Thank you for registering for ACD 2026! Your payment has been successfully processed and your registration is now confirmed.</p>
            
            <p><strong>Note:</strong> You will receive a separate email shortly containing your E-Ticket and QR Code for entry.</p>

            <div class="event-info">
              <h3>🎪 Event Information</h3>
              <p><strong>Event:</strong> ACD 2026</p>
              <p><strong>Dates:</strong> January 28-29, 2026</p>
              <p><strong>Venue:</strong> Urmila Tai Karad Auditorium, MIT ADT Pune</p>
              <p><strong>Time:</strong> 8:00 AM - 5:00 PM</p>
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
              <p>Thank you for choosing ACD 2026!</p>
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
ACD 2026 Event Registration Confirmation

Dear ${name},

Your registration has been confirmed! Here are your details:

EVENT INFORMATION:
- Event: ACD 2026
- Dates: January 28-29, 2026
- Venue: Urmila Tai Karad Auditorium, MIT ADT Pune
- Time: 8:00 AM - 5:00 PM

REGISTRATION DETAILS:
Registration ID: ${_id}
Name: ${name}
Email: ${email}
College: ${college}
Year: ${year}
Amount Paid: ₹${amount / 100}
Registration Date: ${new Date(createdAt).toLocaleString('en-IN')}

Note: You will receive a separate email shortly containing your E-Ticket and QR Code for entry.

Thank you for registering for ACD 2026!

Event Organization Team
    `
  }
}

// E-Ticket Email Template
const generateTicketEmail = async (registrationData) => {
  // Convert Mongoose document to plain object if needed
  const regData = registrationData.toObject ? registrationData.toObject() : registrationData
  const { 
    name, 
    email, 
    _id, 
    college, 
    year, 
    amount, 
    ticketNumber: existingTicketNumber,
    isGroupMember = false,
    groupPrimaryEmail = null,
    memberNumber = null,
    totalMembers = null
  } = regData

  // Use existing ticket number if available, otherwise generate new one
  const ticketNumber = existingTicketNumber || generateTicketNumber()

  // Generate QR code buffer
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

  const subjectText = isGroupMember ? 
    `🎫 Your ACD 2026 E-Ticket (Group Booking #${memberNumber}/${totalMembers})` :
    'Your E-Ticket - ACD 2026'

  const emailTitle = isGroupMember ? 
    `🎫 E-Ticket for ACD 2026 (Group Member ${memberNumber})` :
    '🎫 Your E-Ticket - ACD 2026'

  const welcomeText = isGroupMember ?
    `Dear ${name},\n\nHere is your individual E-Ticket for ACD 2026! This ticket is part of a group booking organized by ${groupPrimaryEmail}.` :
    `Dear ${name},\n\nThank you for your registration! Here is your E-Ticket for ACD 2026.`

  const additionalInfo = isGroupMember ?
    `\n• This is ticket ${memberNumber} of ${totalMembers} in your group\n• Each member has received their own individual ticket\n• Group booking managed by: ${groupPrimaryEmail}` :
    ''

  return {
    ticketNumber,
    qrCodeBuffer,
    subject: subjectText,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ACD 2026 E-Ticket</title>
      </head>
      <body style="margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1>${emailTitle}</h1>
            <p>Welcome to ACD 2026!</p>
            ${isGroupMember ? `<p style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin-top: 20px;">Group Member ${memberNumber} of ${totalMembers}</p>` : ''}
          </div>
        </div>
        ${ticketHTML}
      </body>
      </html>
    `,
    text: `
ACD 2026 E-Ticket ${isGroupMember ? `(Group Member ${memberNumber}/${totalMembers})` : ''}

${welcomeText}

Ticket Number: ${ticketNumber}
Name: ${name}
Event: ACD 2026 - ACES Community Day${additionalInfo}

Important Instructions:
• Present this QR code at the entrance
• Arrive at least 15 minutes early
• Bring a valid photo ID
• Contact support for any issues

Event Details:
Date: January 28-29, 2026
Time: 8:00 AM - 5:00 PM  
Venue: Urmila Tai Karad Auditorium, MIT ADT Pune

For support, contact:
Aayush: 9226750350
Ishan: 9552448038

Thank you for joining ACD 2026!
Event Organization Team
    `
  }
}

// Pending Payment Email Template - Professional Design (Matching Ticket Style)
const generatePendingPaymentEmail = (registrationData) => {
  const regData = registrationData.toObject ? registrationData.toObject() : registrationData
  const { name, email, college, year, amount, _id, createdAt } = regData

  // Hardcoded to 48 hours for early bird offer
  const timeRemaining = 48

  return {
    subject: '⏰ Complete Your Registration - Early Bird Offer Active | ACD 2026',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your Registration - ACD 2026</title>
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
                Thank you for initiating your registration for <strong style="color: #c084fc;">ACD 2026</strong>. We're excited to have you join us for this premier community event.
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
                      <div style="text-decoration: line-through; color: #6b7280; font-size: 24px; font-weight: bold;">₹249</div>
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
                      <span style="color: #d1d5db; font-size: 12px; font-weight: 500;">ACD 2026 - ACES Community Day</span>
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
                      <span style="color: #d1d5db; font-size: 12px; font-weight: 500;">8:00 AM - 5:00 PM</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0;">
                      <span style="color: #9ca3af; font-size: 12px;">Venue:</span>
                    </td>
                    <td align="right" style="padding: 6px 0;">
                      <span style="color: #d1d5db; font-size: 12px; font-weight: 500;">Urmila Tai Karad Auditorium, MIT ADT Pune</span>
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
              
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 13px;">Thank you for choosing ACD 2026</p>
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
ACD 2026 - Complete Your Registration

Dear ${name},

Thank you for initiating your registration for ACD 2026. We're excited to have you join us for this premier community event.

⚡ EARLY BIRD PRICING ACTIVE
Complete your payment within ${timeRemaining} hours to secure this exclusive rate.

OFFER EXPIRES IN: ${timeRemaining} HOURS

PRICING:
Regular Price: ₹249 (crossed out)
Early Bird Price: ₹${amount / 100}
YOU SAVE: ₹${Math.floor((amount / 100) * 0.5)}

YOUR REGISTRATION DETAILS:
Registration ID: ${_id}
Name: ${name}
College: ${college}
Year: ${year}
Amount to Pay: ₹${amount / 100}

EVENT INFORMATION:
Event: ACD 2026 - ACES Community Day
Dates: January 28-29, 2026
Time: 8:00 AM - 5:00 PM
Venue: Urmila Tai Karad Auditorium, MIT ADT Pune

⚠️ IMPORTANT:
Your registration will be confirmed only after successful payment completion. Early bird pricing is subject to availability and time constraints.

Complete your payment here: ${process.env.FRONTEND_URL || 'https://acd.acesmitadt.com'}/payment/${_id}

NEED ASSISTANCE?
Aayush: 9226750350
Ishan: 9552448038
Email: mail@acesmitadt.com

Thank you for choosing ACD 2026
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
// Send confirmation emails for group bookings
export const sendGroupConfirmationEmails = async (registrationData) => {
  try {
    console.log('📧 Starting group confirmation emails for registration:', registrationData._id)
    
    const fromAddress = 'ACD 2026 Event <' + (process.env.EMAIL_FROM || 'noreply@acesmitadt.com') + '>'
    const results = []

    // 1. Send emails to primary member
    console.log('📧 Sending emails to primary member:', registrationData.email)
    const primaryResult = await sendConfirmationEmail(registrationData)
    results.push({
      email: registrationData.email,
      type: 'primary',
      ...primaryResult
    })

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Send individual tickets to each group member
    if (registrationData.isGroupBooking && registrationData.groupMembers) {
      for (let i = 0; i < registrationData.groupMembers.length; i++) {
        const member = registrationData.groupMembers[i]
        console.log(`📧 Sending ticket to group member ${i + 2}:`, member.email)

        try {
          // Generate individual ticket number and QR for this member
          const memberTicketNumber = generateTicketNumber()
          const memberQrData = {
            ticketNumber: memberTicketNumber,
            registrationId: registrationData._id.toString(),
            name: member.name,
            email: member.email,
            eventCode: 'ACD-2026',
            generatedAt: new Date().toISOString(),
            memberIndex: i + 1,
            groupBooking: true
          }
          
          const memberQrCodeBuffer = await generateQRCodeBuffer(memberQrData)

          // Create member-specific ticket data
          const memberTicketData = {
            _id: registrationData._id,
            name: member.name,
            email: member.email,
            college: member.college,
            year: member.year,
            amount: registrationData.amount,
            ticketNumber: memberTicketNumber,
            isGroupMember: true,
            groupPrimaryEmail: registrationData.email,
            memberNumber: i + 2,
            totalMembers: registrationData.ticketQuantity
          }

          const ticketEmail = await generateTicketEmail(memberTicketData)
          
          const memberTicketInfo = await sendEmailWithRetry({
            from: fromAddress,
            to: member.email,
            subject: `🎫 Your ACD 2026 E-Ticket (Group Booking)`,
            html: ticketEmail.html,
            text: ticketEmail.text,
            attachments: [
              {
                filename: `ACD-2026-Ticket-${memberTicketNumber}.png`,
                content: memberQrCodeBuffer,
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

          // Update group member with ticket info in database
          registrationData.groupMembers[i].ticketNumber = memberTicketNumber
          registrationData.groupMembers[i].qrCode = memberQrCodeBuffer.toString('base64')

          results.push({
            email: member.email,
            type: 'group_member',
            memberIndex: i + 1,
            success: true,
            messageId: memberTicketInfo.messageId,
            ticketNumber: memberTicketNumber
          })

          console.log(`✅ Ticket sent to group member ${i + 2}:`, memberTicketInfo.messageId)

          // Add delay between member emails
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (memberError) {
          console.error(`❌ Failed to send ticket to group member ${i + 2} (${member.email}):`, memberError)
          results.push({
            email: member.email,
            type: 'group_member',
            memberIndex: i + 1,
            success: false,
            error: memberError.message
          })
        }
      }
    }

    // Save updated registration with group member ticket numbers
    await registrationData.save()

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    return {
      success: successCount > 0,
      totalSent: successCount,
      totalAttempted: totalCount,
      results: results,
      primaryTicketNumber: primaryResult.ticketNumber
    }

  } catch (error) {
    console.error('❌ Group email sending failed:', error)
    return { success: false, error: error.message }
  }
}

export const sendConfirmationEmail = async (registrationData) => {
  try {
    // Check if emails were already sent for this registration
    if (registrationData.ticketGenerated && registrationData.emailSentAt) {
      console.log('⚠️ Resending emails for registration:', registrationData._id, '(using existing ticket number)')
      // Continue to resend with the same ticket number instead of blocking
    }

    const fromAddress = 'ACD 2026 Event <' + (process.env.EMAIL_FROM || 'noreply@acesmitadt.com') + '>'

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
          filename: `ACD-2026-Ticket-${ticketEmail.ticketNumber}.png`,
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
      from: 'ACD 2026 Event <' + (process.env.EMAIL_FROM || 'noreply@acesmitadt.com') + '>',
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
            from: 'ACD 2026 Notifications <' + (process.env.NOREPLY_EMAIL_USER || 'noreply@acesmitadt.com') + '>',
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
                    <h1>🎪 ACD 2026</h1>
                    <p>${subject}</p>
                  </div>
                  
                  <div class="content">
                    <div class="message">
                      ${personalizedMessage}
                    </div>
                    
                    <div class="footer">
                      <p>Best regards,<br/>ACD 2026 Team</p>
                      <p><small>This is an automated message. Please do not reply to this email.</small></p>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `,
            text: `${subject}\n\n${personalizedMessage}\n\nBest regards,\nACD 2026 Team`
          }

          const info = await noreplyTransporter.sendMail(mailOptions)
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
    const fromAddress = 'ACD 2026 Notifications <' + (process.env.NOREPLY_EMAIL_USER || 'noreply@acesmitadt.com') + '>'

    console.log('📧 Sending pending payment reminder email...')
    const pendingEmail = generatePendingPaymentEmail(registrationData)

    // Helper function to send with noreply transporter
    const sendWithNoreply = async (mailOptions, maxRetries = 3) => {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`📧 Sending pending payment email (attempt ${attempt}/${maxRetries})...`);
          const info = await noreplyTransporter.sendMail(mailOptions);
          return info;
        } catch (error) {
          lastError = error;
          console.error(`❌ Pending payment email attempt ${attempt} failed:`, error.message);
          if (error.code === 'EAUTH' || error.responseCode === 535) {
            throw error;
          }
          if (attempt < maxRetries) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      throw lastError;
    };

    const info = await sendWithNoreply({
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

// Function to send timing correction email
export const sendTimingCorrectionEmail = async (registrationData) => {
  try {
    const regData = registrationData.toObject ? registrationData.toObject() : registrationData
    const { name, email } = regData
    const fromAddress = 'ACD 2026 Notifications <' + (process.env.NOREPLY_EMAIL_USER || 'noreply@acesmitadt.com') + '>'

    console.log('📧 Sending timing correction email...')

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: '⚠️ Important Update: Event Timing Correction - ACD 2026',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Timing Correction - ACD 2026</title>
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
                          <span style="font-size: 24px;">⚠️</span>
                        </div>
                      </div>
                    </td>
                    <td valign="middle" style="padding-left: 12px;">
                      <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: white; line-height: 1.2;">Important Update</h1>
                      <p style="margin: 0; color: #fbbf24; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">Event Timing Correction</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Main Content -->
              <div style="padding: 30px 20px; background-color: #1a1a1a; border-top: 1px solid #374151;">
                
                <!-- Greeting -->
                <p style="margin: 0 0 16px 0; color: #d1d5db; font-size: 15px;">Dear <strong style="color: white;">${name}</strong>,</p>
                
                <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                  We're writing to inform you of an important correction regarding the event timing for <strong style="color: #c084fc;">ACD 2026</strong>.
                </p>

                <!-- Correction Notice Box -->
                <div style="background: rgba(234, 179, 8, 0.1); border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 25px 0;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="vertical-align: top; width: 40px;">
                        <div style="width: 36px; height: 36px; background: rgba(234, 179, 8, 0.2); border-radius: 50%; text-align: center; line-height: 36px; font-size: 20px;">⏰</div>
                      </td>
                      <td style="padding-left: 15px;">
                        <h3 style="margin: 0 0 8px 0; color: #fbbf24; font-size: 16px; font-weight: 600;">Timing Correction</h3>
                        <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 1.5;">
                          Our previous email contained an error in the event timing. Please note the <strong style="color: #fbbf24;">corrected timing</strong> below.
                        </p>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Timing Comparison -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
                  <tr>
                    <td width="50%" style="padding-right: 10px; vertical-align: top;">
                      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 20px; text-align: center;">
                        <p style="margin: 0 0 8px 0; color: #ef4444; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Incorrect (Previous)</p>
                        <div style="text-decoration: line-through; color: #ef4444; font-size: 20px; font-weight: bold;">8:00 PM - 5:00 PM</div>
                      </div>
                    </td>
                    <td width="50%" style="padding-left: 10px; vertical-align: top;">
                      <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%); border: 2px solid #22c55e; border-radius: 10px; padding: 20px; text-align: center;">
                        <p style="margin: 0 0 8px 0; color: #4ade80; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">✓ Correct Timing</p>
                        <div style="color: #22c55e; font-size: 24px; font-weight: bold;">8:00 AM - 5:00 PM</div>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Event Information -->
                <div style="background: rgba(37, 99, 235, 0.1); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 10px; padding: 20px; margin: 25px 0;">
                  <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 15px; font-weight: 600;">📅 Confirmed Event Details</h3>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding: 6px 0;">
                        <span style="color: #9ca3af; font-size: 12px;">Event:</span>
                      </td>
                      <td align="right" style="padding: 6px 0;">
                        <span style="color: #d1d5db; font-size: 12px; font-weight: 500;">ACD 2026 - ACES Community Day</span>
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
                        <span style="color: #22c55e; font-size: 14px; font-weight: 700;">8:00 AM - 5:00 PM</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0;">
                        <span style="color: #9ca3af; font-size: 12px;">Venue:</span>
                      </td>
                      <td align="right" style="padding: 6px 0;">
                        <span style="color: #d1d5db; font-size: 12px; font-weight: 500;">Urmila Tai Karad Auditorium, MIT ADT Pune</span>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Apology Note -->
                <div style="background: rgba(168, 85, 247, 0.1); border-left: 3px solid #a855f7; border-radius: 8px; padding: 16px; margin: 25px 0;">
                  <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 1.6;">
                    We sincerely apologize for any inconvenience this may have caused. Please make note of the <strong style="color: #c084fc;">correct timing: 8:00 AM - 5:00 PM</strong>. We look forward to seeing you at the event!
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
                
                <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 13px;">Thank you for your understanding</p>
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
ACD 2026 - Important Event Timing Correction

Dear ${name},

We're writing to inform you of an important correction regarding the event timing for ACD 2026.

⚠️ TIMING CORRECTION

Our previous email contained an error in the event timing. Please note the corrected timing below.

INCORRECT (Previous): 8:00 PM - 5:00 PM (crossed out)
✓ CORRECT TIMING: 8:00 AM - 5:00 PM

CONFIRMED EVENT DETAILS:
Event: ACD 2026 - ACES Community Day
Dates: January 28-29, 2026
Time: 8:00 AM - 5:00 PM
Venue: Urmila Tai Karad Auditorium, MIT ADT Pune

We sincerely apologize for any inconvenience this may have caused. Please make note of the correct timing: 8:00 AM - 5:00 PM. We look forward to seeing you at the event!

NEED ASSISTANCE?
Aayush: 9226750350
Ishan: 9552448038
Email: mail@acesmitadt.com

Thank you for your understanding
ACES Event Organization Team

This is an automated email. For support, contact mail@acesmitadt.com
      `
    }

    const info = await noreplyTransporter.sendMail(mailOptions)
    console.log('✅ Timing correction email sent:', info.messageId)

    return {
      success: true,
      messageId: info.messageId
    }
  } catch (error) {
    console.error('❌ Timing correction email failed:', error)
    return { success: false, error: error.message }
  }
}

// Friend OTP Email Template
export const sendFriendOTPEmail = async (email, userName, otp) => {
  try {
    console.log('📧 sendFriendOTPEmail called')
    console.log(`To: ${email}, User: ${userName}, OTP: ${otp}`)
    
    const fromAddress = 'ACD 2026 OTP <' + (process.env.OTP_EMAIL_USER || 'no.reply@acesmitadt.com') + '>'
    console.log(`From: ${fromAddress}`)
    
    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: 'Friend Referral OTP - ACD 2026',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border-left: 4px solid #667eea; }
            .otp { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px; font-family: monospace; }
            .highlight { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Friend Referral OTP</h1>
              <p>ACD 2026 - Bring Your Friend Offer</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${userName}</strong>,</p>
              
              <p>Someone wants to register for ACD 2026 using your referral and enjoy <strong>₹100 discount</strong>!</p>
              
              <div class="highlight">
                <h3>🎯 Bring Your Friend Offer</h3>
                <p><strong>Your friend gets:</strong> ₹100 discount (Pay only ₹99 instead of ₹199)</p>
                <p><strong>Valid for:</strong> Individual registrations only</p>
              </div>
              
              <p>To proceed with your friend's registration, please use the following OTP:</p>
              
              <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your OTP Code:</p>
                <div class="otp">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Valid for 10 minutes</p>
              </div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This OTP is valid for <strong>10 minutes</strong> only</li>
                <li>You can refer only <strong>1 friend</strong> with this offer</li>
                <li>Your friend must complete payment of ₹99 for the ticket</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
              
              <div class="footer">
                <p>Best regards,<br/>ACD 2026 Team</p>
                <p><small>This is an automated email. Please do not reply to this message.</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Friend Referral OTP - ACD 2026

Dear ${userName},

Someone wants to register for ACD 2026 using your referral and enjoy ₹100 discount!

🎯 BRING YOUR FRIEND OFFER:
- Your friend gets: ₹100 discount (Pay only ₹99 instead of ₹199)
- Valid for: Individual registrations only

Your OTP Code: ${otp}
Valid for: 10 minutes

IMPORTANT:
- This OTP is valid for 10 minutes only
- You can refer only 1 friend with this offer
- Your friend must complete payment of ₹99 for the ticket
- If you didn't request this, please ignore this email

Best regards,
ACD 2026 Team
      `
    }

    console.log('📤 Sending OTP email via otpTransporter...')
    const info = await otpTransporter.sendMail(mailOptions)
    console.log('✅ OTP email sent successfully! Message ID:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Friend OTP email failed:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: error.response
    })
    return { success: false, error: error.message }
  }
}

// Friend Registration Confirmation Email
export const sendFriendRegistrationConfirmation = async (friendEmail, friendName, referrerName, discountAmount) => {
  try {
    const fromAddress = 'ACD 2026 Event <' + (process.env.EMAIL_FROM || 'noreply@acesmitadt.com') + '>'
    
    const mailOptions = {
      from: fromAddress,
      to: friendEmail,
      subject: 'Friend Referral Registration - ACD 2026',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .offer-box { background: linear-gradient(135deg, #10B981 0%, #22c55e 100%); color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .pricing { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
            .price-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
            .price-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; color: #10B981; }
            .event-info { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Friend Referral Success!</h1>
              <p>Welcome to ACD 2026</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${friendName}</strong>,</p>
              
              <p>Great news! Thanks to your friend <strong>${referrerName}</strong>, you've been successfully registered for ACD 2026 with a special friend discount!</p>
              
              <div class="offer-box">
                <h2 style="margin: 0 0 10px 0;">🎯 Friend Discount Applied!</h2>
                <p style="margin: 0; font-size: 18px;">You saved ₹100 with this referral!</p>
              </div>
              
              <div class="pricing">
                <h3 style="margin: 0 0 15px 0; color: #333;">Your Pricing:</h3>
                <div class="price-row">
                  <span>Original Price:</span>
                  <span style="text-decoration: line-through; color: #666;">₹199</span>
                </div>
                <div class="price-row">
                  <span>Friend Discount:</span>
                  <span style="color: #10B981;">-₹100</span>
                </div>
                <div class="price-row">
                  <span>Amount to Pay:</span>
                  <span>₹99</span>
                </div>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Complete your payment of <strong>₹99</strong></li>
                <li>Admin will verify your payment</li>
                <li>You'll receive your E-ticket via email</li>
                <li>Present your QR code at the event for entry</li>
              </ol>
              
              <div class="event-info">
                <h3>🎪 Event Information</h3>
                <p><strong>Event:</strong> ACD 2026 - ACES Community Day</p>
                <p><strong>Dates:</strong> January 28-29, 2026</p>
                <p><strong>Venue:</strong> Urmila Tai Karad Auditorium, MIT ADT Pune</p>
                <p><strong>Time:</strong> 8:00 AM - 5:00 PM</p>
              </div>
              
              <p><strong>Important Notes:</strong></p>
              <ul>
                <li>This is a special friend referral registration</li>
                <li>Payment verification may take up to 24 hours</li>
                <li>You'll receive a separate email with your ticket after payment verification</li>
                <li>Make sure to thank your friend <strong>${referrerName}</strong> for the referral! 😊</li>
              </ul>
              
              <div class="footer">
                <p>Thank you for joining ACD 2026!</p>
                <p>Best regards,<br/>ACD 2026 Team</p>
                <p><small>For support, contact us at mail@acesmitadt.com</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Friend Referral Registration - ACD 2026

Dear ${friendName},

Great news! Thanks to your friend ${referrerName}, you've been successfully registered for ACD 2026 with a special friend discount!

🎯 FRIEND DISCOUNT APPLIED!
You saved ₹100 with this referral!

YOUR PRICING:
Original Price: ₹199 (crossed out)
Friend Discount: -₹100
Amount to Pay: ₹99

NEXT STEPS:
1. Complete your payment of ₹99
2. Admin will verify your payment
3. You'll receive your E-ticket via email
4. Present your QR code at the event for entry

EVENT INFORMATION:
Event: ACD 2026 - ACES Community Day
Dates: January 28-29, 2026
Venue: Urmila Tai Karad Auditorium, MIT ADT Pune
Time: 8:00 AM - 5:00 PM

IMPORTANT NOTES:
- This is a special friend referral registration
- Payment verification may take up to 24 hours
- You'll receive a separate email with your ticket after payment verification
- Make sure to thank your friend ${referrerName} for the referral! 😊

Thank you for joining ACD 2026!

Best regards,
ACD 2026 Team

For support, contact us at mail@acesmitadt.com
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Friend registration confirmation email failed:', error)
    return { success: false, error: error.message }
  }
}

// Bring Friend Offer Promotion Email Template
const generateBringFriendPromotionEmail = (registrationData) => {
  const regData = registrationData.toObject ? registrationData.toObject() : registrationData
  const { name, email } = regData

  return {
    subject: '� Exclusive Offer - Bring Your Friend & Save! | ACD 2026',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bring Your Friend - ACD 2026</title>
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
                        <span style="font-size: 24px;">🎁</span>
                      </div>
                    </div>
                  </td>
                  <td valign="middle" style="padding-left: 12px;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: white; line-height: 1.2;">ACD 2026</h1>
                    <p style="margin: 0; color: #a855f7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">Bring Your Friend Offer</p>
                  </td>
                  <td align="right" valign="top">
                    <span style="background-color: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 20px; padding: 4px 10px; color: #ec4899; font-size: 9px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; display: inline-block; white-space: nowrap;">Exclusive</span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Main Content -->
            <div style="padding: 30px 20px; background-color: #1a1a1a; border-top: 1px solid #374151;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #d1d5db; font-size: 15px;">Dear <strong style="color: white;">${name}</strong>,</p>
              
              <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                As a valued registered attendee of <strong style="color: #c084fc;">ACD 2026</strong>, we're excited to offer you an exclusive opportunity to bring your friends at a special discounted rate!
              </p>

              <!-- Offer Highlight Box -->
              <div style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%); border: 2px solid #ec4899; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                <div style="background: rgba(236, 72, 153, 0.15); display: inline-block; padding: 8px 16px; border-radius: 20px; margin-bottom: 15px;">
                  <span style="color: #ec4899; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">🎊 Special Friend Offer</span>
                </div>
                <h2 style="margin: 0 0 15px 0; color: white; font-size: 24px; font-weight: bold;">Help Your Friends Save ₹100!</h2>
                <p style="margin: 0; color: #d1d5db; font-size: 14px;">Your friends can join ACD 2026 at an exclusive discounted price</p>
              </div>

              <!-- Pricing Comparison -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
                <tr>
                  <td width="50%" style="padding-right: 10px; vertical-align: top;">
                    <div style="background: #151515; border: 1px solid #374151; border-radius: 10px; padding: 20px; text-align: center;">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Regular Price</p>
                      <div style="text-decoration: line-through; color: #6b7280; font-size: 28px; font-weight: bold;">₹199</div>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 10px; vertical-align: top;">
                    <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%); border: 2px solid #22c55e; border-radius: 10px; padding: 20px; text-align: center;">
                      <p style="margin: 0 0 8px 0; color: #4ade80; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Friend Price</p>
                      <div style="color: #22c55e; font-size: 36px; font-weight: bold;">₹99</div>
                      <div style="background: #22c55e; color: #000; padding: 4px 12px; border-radius: 12px; display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 700;">SAVE ₹100</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- How It Works -->
              <div style="background: #151515; border: 1px solid #374151; border-radius: 10px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 16px 0; color: #d1d5db; font-size: 15px; font-weight: 600;">📋 How It Works</h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 12px 0; vertical-align: top; border-bottom: 1px solid #374151;">
                      <div style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #9333ea, #2563eb); border-radius: 50%; text-align: center; line-height: 24px; font-size: 11px; font-weight: bold; margin-right: 12px; color: white;">1</div>
                      <span style="color: #d1d5db; font-size: 13px;">Share the offer with your friends</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; vertical-align: top; border-bottom: 1px solid #374151;">
                      <div style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #9333ea, #2563eb); border-radius: 50%; text-align: center; line-height: 24px; font-size: 11px; font-weight: bold; margin-right: 12px; color: white;">2</div>
                      <span style="color: #d1d5db; font-size: 13px;">They select "Bring a Friend" during registration</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; vertical-align: top; border-bottom: 1px solid #374151;">
                      <div style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #9333ea, #2563eb); border-radius: 50%; text-align: center; line-height: 24px; font-size: 11px; font-weight: bold; margin-right: 12px; color: white;">3</div>
                      <span style="color: #d1d5db; font-size: 13px;">Enter your email for verification</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; vertical-align: top; border-bottom: 1px solid #374151;">
                      <div style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #9333ea, #2563eb); border-radius: 50%; text-align: center; line-height: 24px; font-size: 11px; font-weight: bold; margin-right: 12px; color: white;">4</div>
                      <span style="color: #d1d5db; font-size: 13px;">Complete OTP verification</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; vertical-align: top;">
                      <div style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #9333ea, #2563eb); border-radius: 50%; text-align: center; line-height: 24px; font-size: 11px; font-weight: bold; margin-right: 12px; color: white;">5</div>
                      <span style="color: #d1d5db; font-size: 13px;">They pay only ₹99 and enjoy the event!</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Benefits Section -->
              <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 10px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 16px 0; color: #a855f7; font-size: 15px; font-weight: 600;">✨ Why Your Friends Should Join</h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="32" valign="top" style="padding: 8px 0;">
                      <div style="width: 28px; height: 28px; background: rgba(168, 85, 247, 0.15); border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px;">🎓</div>
                    </td>
                    <td style="padding: 8px 0 8px 12px;">
                      <div style="color: #d1d5db; font-size: 13px; font-weight: 600; margin-bottom: 2px;">Network with Industry Leaders</div>
                      <div style="color: #9ca3af; font-size: 12px;">Connect with tech professionals and innovators</div>
                    </td>
                  </tr>
                  <tr>
                    <td width="32" valign="top" style="padding: 8px 0;">
                      <div style="width: 28px; height: 28px; background: rgba(168, 85, 247, 0.15); border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px;">🚀</div>
                    </td>
                    <td style="padding: 8px 0 8px 12px;">
                      <div style="color: #d1d5db; font-size: 13px; font-weight: 600; margin-bottom: 2px;">Hands-on Workshops</div>
                      <div style="color: #9ca3af; font-size: 12px;">Learn cutting-edge technologies and skills</div>
                    </td>
                  </tr>
                  <tr>
                    <td width="32" valign="top" style="padding: 8px 0;">
                      <div style="width: 28px; height: 28px; background: rgba(168, 85, 247, 0.15); border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px;">🏆</div>
                    </td>
                    <td style="padding: 8px 0 8px 12px;">
                      <div style="color: #d1d5db; font-size: 13px; font-weight: 600; margin-bottom: 2px;">Exciting Competitions</div>
                      <div style="color: #9ca3af; font-size: 12px;">Participate in hackathons and win prizes</div>
                    </td>
                  </tr>
                  <tr>
                    <td width="32" valign="top" style="padding: 8px 0;">
                      <div style="width: 28px; height: 28px; background: rgba(168, 85, 247, 0.15); border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px;">🤝</div>
                    </td>
                    <td style="padding: 8px 0 8px 12px;">
                      <div style="color: #d1d5db; font-size: 13px; font-weight: 600; margin-bottom: 2px;">Community Building</div>
                      <div style="color: #9ca3af; font-size: 12px;">Join a vibrant community of like-minded individuals</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://acd.acesmitadt.com/bring-friend" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #a855f7); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);">
                  🎟️ Share with Friends Now
                </a>
                <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 11px;">Limited time offer</p>
              </div>

              <!-- Event Details -->
              <div style="background: #151515; border: 1px solid #374151; border-radius: 10px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 16px 0; color: #d1d5db; font-size: 15px; font-weight: 600;">📅 Event Details</h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #6b7280; font-size: 12px;">Event</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #d1d5db; font-size: 12px;">ACD 2026</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #6b7280; font-size: 12px;">Dates</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #d1d5db; font-size: 12px;">January 28-29, 2026</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #6b7280; font-size: 12px;">Venue</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #d1d5db; font-size: 12px;">Urmila Tai Karad Auditorium</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #6b7280; font-size: 12px;">Location</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #374151;">
                      <span style="color: #d1d5db; font-size: 12px;">MIT ADT Pune</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #6b7280; font-size: 12px;">Time</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <span style="color: #d1d5db; font-size: 12px;">8:00 AM - 5:00 PM</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Terms & Conditions -->
              <div style="background: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.2); border-radius: 10px; padding: 15px; margin: 25px 0;">
                <p style="margin: 0 0 8px 0; color: #fbbf24; font-size: 12px; font-weight: 600;">⚠️ Important Notes</p>
                <ul style="margin: 0; padding-left: 20px; color: #d1d5db; font-size: 11px; line-height: 1.7;">
                  <li>Only registered attendees with completed payment can refer friends</li>
                  <li>Friends must complete OTP verification using your email</li>
                  <li>Each user can refer one friend maximum</li>
                  <li>Offer valid until event date or while slots are available</li>
                  <li>Friend registrations are subject to admin verification</li>
                </ul>
              </div>

              <!-- Closing -->
              <p style="margin: 25px 0 15px 0; color: #9ca3af; font-size: 13px; text-align: center;">
                Help your friends save ₹100 and create amazing memories together at ACD 2026!
              </p>

            </div>

            <!-- Footer -->
            <div style="background: #151515; border-top: 1px solid #374151; padding: 20px; text-align: center;">
              <p style="margin: 0 0 12px 0; color: #a855f7; font-size: 13px; font-weight: 600;">ACD 2026 - ACES Community Day</p>
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 11px;">MIT ADT University, Pune</p>
              
              <div style="margin: 15px 0;">
                <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 11px; font-weight: 600;">For queries, contact:</p>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="50%" style="text-align: center; padding: 5px;">
                      <a href="tel:+919226750350" style="color: #60a5fa; text-decoration: none; font-size: 11px;">
                        <strong>Aayush:</strong> 9226750350
                      </a>
                    </td>
                    <td width="50%" style="text-align: center; padding: 5px;">
                      <a href="tel:+919552448038" style="color: #60a5fa; text-decoration: none; font-size: 11px;">
                        <strong>Ishan:</strong> 9552448038
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
              
              <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 10px;">
                Email: <a href="mailto:mail@acesmitadt.com" style="color: #60a5fa; text-decoration: none;">mail@acesmitadt.com</a>
              </p>
              
              <p style="margin: 15px 0 0 0; color: #4b5563; font-size: 10px; line-height: 1.5;">
                This is an automated promotional email. You're receiving this because you're registered for ACD 2026.
              </p>
            </div>

          </div>
        </div>
      </body>
      </html>
    `,
    text: `
🎉 SPECIAL OFFER - BRING YOUR FRIEND & SAVE! 🎉
ACD 2026 - ACES Community Day

Dear ${name},

As a valued registered attendee of ACD 2026, we're excited to offer you an exclusive opportunity to bring your friends and help them save big!

🎁 BRING A FRIEND OFFER:
Your friends can register for only ₹99 instead of ₹199!
That's a massive ₹100 savings!

✨ WHY YOUR FRIENDS SHOULD JOIN:
• Network with Industry Leaders - Connect with tech professionals and innovators
• Hands-on Workshops - Learn cutting-edge technologies and skills
• Exciting Competitions - Participate in hackathons and win amazing prizes
• Community Building - Join a vibrant community of like-minded individuals

📋 HOW IT WORKS:
1. Share this offer with friends who haven't registered yet
2. They visit the registration page and select "Bring a Friend" option
3. They enter your email ID for verification
4. They complete OTP verification and pay only ₹99!
5. Both of you enjoy ACD 2026 together! 🎉

📅 EVENT DETAILS:
Event: ACD 2026 - ACES Community Day
Dates: January 28-29, 2026
Venue: Urmila Tai Karad Auditorium, MIT ADT Pune
Time: 8:00 AM - 5:00 PM

⚠️ IMPORTANT NOTES:
• Only registered attendees can refer friends
• You must have successfully registered and paid for ACD 2026
• Friends must complete OTP verification using your email
• Offer valid until event date or while slots are available
• Friend registrations are subject to admin verification

🎟️ Registration Link: https://acd-ticket.vercel.app

Help your friends save ₹100 and create amazing memories together at ACD 2026!

For queries, contact:
Aayush: 9226750350
Ishan: 9552448038
Email: mail@acesmitadt.com

---
ACD 2026 - ACES Community Day
MIT ADT University, Pune

This is an automated promotional email. You're receiving this because you're registered for ACD 2026.
    `
  }
}

// Send Bring Friend Promotion Email
export const sendBringFriendPromotionEmail = async (registrationData) => {
  try {
    const regData = registrationData.toObject ? registrationData.toObject() : registrationData
    const { name, email } = regData

    const emailTemplate = generateBringFriendPromotionEmail(registrationData)

    const mailOptions = {
      from: `"ACD 2026 - Special Offer" <${process.env.OTP_EMAIL_USER || 'no.reply@acesmitadt.com'}>`,
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    }

    const info = await otpTransporter.sendMail(mailOptions)
    console.log(`✅ Bring friend promotion email sent to ${name} (${email})`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Bring friend promotion email failed:', error)
    return { success: false, error: error.message }
  }
}
