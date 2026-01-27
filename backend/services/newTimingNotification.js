import { sendNoreplyEmailQueued } from '../config/emailConfig.js'

// Function to send new timing update email for Day 1 (10 AM - 6 PM)
export const sendNewTimingUpdateEmail = async (registrationData) => {
  try {
    const regData = registrationData.toObject ? registrationData.toObject() : registrationData
    const { name, email } = regData
    const fromAddress = 'ACD 2026 Notifications <' + (process.env.NOREPLY_EMAIL_USER || 'noreply@acesmitadt.com') + '>'

    console.log('📧 Sending new timing update email...')

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: '⏰ Important Update: New Event Timing for Day 1 - ACD 2026',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Timing Update - ACD 2026</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="width: 100%; background-color: #f3f4f6; padding: 20px 10px;">
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background-color: #1a1a1a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); color: white; border: 1px solid #374151;">
              
              <!-- Header Section -->
              <div style="padding: 20px; background-color: #1a1a1a;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="50" valign="middle">
                      <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 10px; padding: 2px;">
                        <div style="background: #1a1a1a; width: 100%; height: 100%; border-radius: 8px; text-align: center; line-height: 36px;">
                          <span style="font-size: 24px;">⏰</span>
                        </div>
                      </div>
                    </td>
                    <td valign="middle" style="padding-left: 12px;">
                      <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: white; line-height: 1.2;">Timing Update</h1>
                      <p style="margin: 0; color: #10b981; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">New Schedule for Day 1</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Main Content -->
              <div style="padding: 30px 20px; background-color: #1a1a1a; border-top: 1px solid #374151;">
                
                <!-- Greeting -->
                <p style="margin: 0 0 16px 0; color: #d1d5db; font-size: 15px;">Dear <strong style="color: white;">${name}</strong>,</p>
                
                <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                  We have an important update regarding the event timing for <strong style="color: #10b981;">Day 1 of ACD 2026</strong>.
                </p>

                <!-- Update Notice Box -->
                <div style="background: rgba(16, 185, 129, 0.1); border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 25px 0;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="vertical-align: top; width: 40px;">
                        <div style="width: 36px; height: 36px; background: rgba(16, 185, 129, 0.2); border-radius: 50%; text-align: center; line-height: 36px; font-size: 20px;">📢</div>
                      </td>
                      <td style="padding-left: 15px;">
                        <h3 style="margin: 0 0 8px 0; color: #10b981; font-size: 16px; font-weight: 600;">Schedule Update</h3>
                        <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 1.5;">
                          The timing for <strong style="color: #10b981;">Day 1 (January 28, 2026)</strong> has been updated to provide you with a better event experience.
                        </p>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- New Timing Highlight -->
                <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%); border: 2px solid #10b981; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
                  <h3 style="margin: 0 0 12px 0; color: #10b981; font-size: 18px; font-weight: 700;">🗓️ NEW TIMING FOR DAY 1</h3>
                  <div style="background: rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 15px; margin: 15px 0;">
                    <p style="margin: 0; color: #10b981; font-size: 24px; font-weight: bold;">10:00 AM - 6:00 PM</p>
                    <p style="margin: 5px 0 0 0; color: #d1d5db; font-size: 12px;">January 28, 2026 (Day 1)</p>
                  </div>
                </div>

                <!-- Full Event Schedule -->
                <div style="background: rgba(37, 99, 235, 0.1); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 10px; padding: 20px; margin: 25px 0;">
                  <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 15px; font-weight: 600;">📅 Complete Event Schedule</h3>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #374151;">
                        <span style="color: #9ca3af; font-size: 12px;">Event:</span>
                      </td>
                      <td align="right" style="padding: 8px 0; border-bottom: 1px solid #374151;">
                        <span style="color: #d1d5db; font-size: 12px; font-weight: 500;">ACD 2026 - ACES Community Day</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #374151;">
                        <span style="color: #9ca3af; font-size: 12px;">Day 1:</span>
                      </td>
                      <td align="right" style="padding: 8px 0; border-bottom: 1px solid #374151;">
                        <span style="color: #10b981; font-size: 14px; font-weight: 700;">January 28, 2026 | 10:00 AM - 6:00 PM</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #374151;">
                        <span style="color: #9ca3af; font-size: 12px;">Day 2:</span>
                      </td>
                      <td align="right" style="padding: 8px 0; border-bottom: 1px solid #374151;">
                        <span style="color: #d1d5db; font-size: 12px; font-weight: 500;">January 29, 2026 | 8:00 AM - 5:00 PM</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="color: #9ca3af; font-size: 12px;">Venue:</span>
                      </td>
                      <td align="right" style="padding: 8px 0;">
                        <span style="color: #d1d5db; font-size: 12px; font-weight: 500;">Urmila Tai Karad Auditorium, MIT ADT Pune</span>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Important Points -->
                <div style="background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 25px 0;">
                  <h4 style="margin: 0 0 8px 0; color: #f59e0b; font-size: 14px; font-weight: 600;">📝 Important Notes</h4>
                  <ul style="margin: 0; color: #d1d5db; font-size: 12px; line-height: 1.6; padding-left: 16px;">
                    <li>Please plan your travel accordingly for the updated Day 1 timing</li>
                    <li>Day 2 timing remains unchanged (8:00 AM - 5:00 PM)</li>
                    <li>All event activities and sessions will follow the new schedule</li>
                    <li>Registration and check-in will open 30 minutes before the event starts</li>
                  </ul>
                </div>

                <!-- Thank You Note -->
                <div style="background: rgba(168, 85, 247, 0.1); border-left: 3px solid #a855f7; border-radius: 8px; padding: 16px; margin: 25px 0;">
                  <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 1.6;">
                    Thank you for your understanding regarding this timing update. We believe this new schedule will enhance your overall event experience. We look forward to seeing you at <strong style="color: #c084fc;">ACD 2026</strong>!
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
                
                <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 13px;">Thank you for being part of ACD 2026</p>
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 12px; font-weight: 600;">ACES Event Organization Team</p>
                
                <p style="margin: 0; color: #6b7280; font-size: 11px;">This is an automated email. For support, contact mail@acesmitadt.com</p>
              </div>

              <!-- Bottom Color Bar -->
              <div style="height: 5px; background: linear-gradient(90deg, #10b981, #059669); width: 100%;"></div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
ACD 2026 - Important Timing Update for Day 1

Dear ${name},

We have an important update regarding the event timing for Day 1 of ACD 2026.

📢 SCHEDULE UPDATE

The timing for Day 1 (January 28, 2026) has been updated to provide you with a better event experience.

🗓️ NEW TIMING FOR DAY 1: 10:00 AM - 6:00 PM
Date: January 28, 2026

COMPLETE EVENT SCHEDULE:
• Day 1: January 28, 2026 | 10:00 AM - 6:00 PM
• Day 2: January 29, 2026 | 8:00 AM - 5:00 PM
• Venue: Urmila Tai Karad Auditorium, MIT ADT Pune

IMPORTANT NOTES:
• Please plan your travel accordingly for the updated Day 1 timing
• Day 2 timing remains unchanged (8:00 AM - 5:00 PM)
• All event activities and sessions will follow the new schedule
• Registration and check-in will open 30 minutes before the event starts

Thank you for your understanding regarding this timing update. We believe this new schedule will enhance your overall event experience. We look forward to seeing you at ACD 2026!

NEED ASSISTANCE?
Aayush: 9226750350
Ishan: 9552448038
Email: mail@acesmitadt.com

Thank you for being part of ACD 2026
ACES Event Organization Team

This is an automated email. For support, contact mail@acesmitadt.com
      `
    }

    const info = await sendNoreplyEmailQueued(mailOptions)
    console.log('✅ New timing update email sent:', info.messageId)

    return {
      success: true,
      messageId: info.messageId
    }
  } catch (error) {
    console.error('❌ New timing update email failed:', error)
    return { success: false, error: 'Unable to send timing update email at this time.' }
  }
}