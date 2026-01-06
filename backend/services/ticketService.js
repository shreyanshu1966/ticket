import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

// Generate unique ticket number
export const generateTicketNumber = () => {
  const prefix = 'ACD2025'
  const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
  const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${timestamp}${randomNumber}`
}

// Generate QR code for ticket (Data URL format)
export const generateQRCode = async (ticketData) => {
  try {
    const qrData = JSON.stringify({
      ticketNumber: ticketData.ticketNumber,
      registrationId: ticketData.registrationId,
      name: ticketData.name,
      email: ticketData.email,
      eventCode: 'ACD-2025',
      generatedAt: new Date().toISOString()
    })

    const qrCode = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      type: 'image/png',
      quality: 0.92
    })

    return qrCode
  } catch (error) {
    console.error('QR Code generation error:', error)
    throw new Error('Failed to generate QR code')
  }
}

// Generate QR code as Buffer for email attachment (CID)
export const generateQRCodeBuffer = async (ticketData) => {
  try {
    const qrData = JSON.stringify({
      ticketNumber: ticketData.ticketNumber,
      registrationId: ticketData.registrationId,
      name: ticketData.name,
      email: ticketData.email,
      eventCode: 'ACD-2025',
      generatedAt: new Date().toISOString()
    })

    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      type: 'png',
      errorCorrectionLevel: 'M'
    })

    return qrCodeBuffer
  } catch (error) {
    console.error('QR Code buffer generation error:', error)
    throw new Error('Failed to generate QR code buffer')
  }
}

// Verify QR code data
export const verifyQRCode = (qrData) => {
  try {
    const data = JSON.parse(qrData)

    // Validate required fields
    if (!data.ticketNumber || !data.registrationId || !data.eventCode) {
      return { valid: false, error: 'Invalid ticket data' }
    }

    // Check event code
    if (data.eventCode !== 'ACD-2025') {
      return { valid: false, error: 'Invalid event ticket' }
    }

    return { valid: true, data }
  } catch (error) {
    return { valid: false, error: 'Invalid QR code format' }
  }
}

// Generate ticket HTML for email
// Generate ticket HTML for email
export const generateTicketHTML = (registrationData) => {
  const { name, email, college, year, ticketNumber, _id, amount } = registrationData
  const eventDate = "January 29-30, 2026"
  const eventTime = "9:00 AM Onwards"
  const ticketType = "General Entry"

  return `
    <div style="width: 100%; background-color: #f3f4f6; padding: 20px 10px;">
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background-color: #1a1a1a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); color: white; border: 1px solid #374151;">
        
        <!-- Header Section (Always Full Width) -->
        <div style="padding: 20px; background-color: #1a1a1a;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td width="50" valign="middle">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #9333ea, #2563eb); border-radius: 10px; padding: 2px;">
                  <div style="background: #1a1a1a; width: 100%; height: 100%; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="cid:aces-logo" alt="ACES Logo" style="width: 32px; height: 32px; object-fit: contain; border: 0;" />
                  </div>
                </div>
              </td>
              <td valign="middle" style="padding-left: 12px;">
                <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: white; line-height: 1.2;">ACD 2026</h1>
                <p style="margin: 0; color: #a855f7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">Annual Cultural Day</p>
              </td>
              <td align="right" valign="top">
                <span style="background-color: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 20px; padding: 4px 10px; color: #d8b4fe; font-size: 9px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; display: inline-block; white-space: nowrap;">Official Ticket</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Main Content: Two Column on Desktop, Stacked on Mobile -->
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
          <tr>
            <!-- Left Section: Attendee Info -->
            <td style="padding: 20px; vertical-align: top; background-color: #1a1a1a; border-top: 1px solid #374151;">
              
              <!-- Attendee Details -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="50%" style="padding-bottom: 16px; vertical-align: top; padding-right: 10px;">
                    <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Attendee</p>
                    <h3 style="margin: 0; font-size: 15px; font-weight: bold; color: white; word-wrap: break-word;">${name}</h3>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px; word-wrap: break-word; overflow-wrap: break-word;">${email}</p>
                  </td>
                  <td width="50%" style="padding-bottom: 16px; vertical-align: top; padding-left: 10px;">
                    <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Ticket Type</p>
                    <h3 style="margin: 0; font-size: 15px; font-weight: bold; color: #c084fc;">${ticketType}</h3>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">₹${amount || '0'} Paid</p>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 10px;">
                    <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">College</p>
                    <p style="margin: 0; font-weight: 500; color: white; font-size: 12px; word-wrap: break-word;">${college}</p>
                  </td>
                  <td width="50%" style="vertical-align: top; padding-left: 10px;">
                    <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Year</p>
                    <p style="margin: 0; font-weight: 500; color: white; font-size: 12px;">${year}</p>
                  </td>
                </tr>
              </table>

              <!-- Event Details -->
              <div style="border-top: 1px solid #374151; padding-top: 16px;">
                <table border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                  <tr>
                    <td style="vertical-align: top; width: 33%; padding-bottom: 12px;">
                      <table border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="width: 20px;">
                            <div style="width: 20px; height: 20px; background-color: #1f2937; border-radius: 50%; text-align: center; color: #9ca3af; line-height: 20px; font-size: 11px;">📅</div>
                          </td>
                          <td style="padding-left: 6px;">
                            <p style="margin: 0; color: #6b7280; font-size: 8px; font-weight: 700; text-transform: uppercase;">Date</p>
                            <p style="margin: 0; color: #d1d5db; font-size: 10px; font-weight: 500;">Jan 29-30</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="vertical-align: top; width: 33%; padding-bottom: 12px;">
                      <table border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="width: 20px;">
                            <div style="width: 20px; height: 20px; background-color: #1f2937; border-radius: 50%; text-align: center; color: #9ca3af; line-height: 20px; font-size: 11px;">⏰</div>
                          </td>
                          <td style="padding-left: 6px;">
                            <p style="margin: 0; color: #6b7280; font-size: 8px; font-weight: 700; text-transform: uppercase;">Time</p>
                            <p style="margin: 0; color: #d1d5db; font-size: 10px; font-weight: 500;">9:00 AM</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="vertical-align: top; width: 33%; padding-bottom: 12px;">
                      <table border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="width: 20px;">
                            <div style="width: 20px; height: 20px; background-color: #1f2937; border-radius: 50%; text-align: center; color: #9ca3af; line-height: 20px; font-size: 11px;">📍</div>
                          </td>
                          <td style="padding-left: 6px;">
                            <p style="margin: 0; color: #6b7280; font-size: 8px; font-weight: 700; text-transform: uppercase;">Location</p>
                            <p style="margin: 0; color: #d1d5db; font-size: 10px; font-weight: 500;">Auditorium</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- QR Code Section (Separate Row for Mobile Stacking) -->
          <tr>
            <td style="padding: 20px; background-color: #151515; text-align: center; border-top: 2px dashed #4b5563;">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em;">Scan Entry</p>
              
              <div style="background: white; padding: 10px; border-radius: 10px; display: inline-block; box-shadow: 0 8px 12px rgba(0, 0, 0, 0.3);">
                <img src="cid:ticket-qr-code" alt="QR Code" width="140" height="140" style="display: block; border: 0;" />
              </div>

              <p style="margin: 12px 0 0 0; color: #c084fc; font-family: monospace; font-size: 13px; letter-spacing: 0.08em; font-weight: bold;">${ticketNumber}</p>
              
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 16px; max-width: 280px; margin-left: auto; margin-right: auto;">
                <tr>
                  <td style="border-bottom: 1px solid #1f2937; padding-bottom: 8px; margin-bottom: 8px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 10px;">Order ID</td>
                        <td align="right" style="color: #d1d5db; font-family: monospace; font-size: 10px;">#ORD-${_id ? _id.toString().slice(0, 6) : '000'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 8px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 10px;">Allowed</td>
                        <td align="right" style="color: #4ade80; font-weight: bold; font-size: 10px;">1 Person</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Bottom Color Bar -->
        <div style="height: 5px; background: linear-gradient(90deg, #9333ea, #2563eb); width: 100%;"></div>
      </div>
    </div>
  `
}