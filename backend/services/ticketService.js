import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

// Generate unique ticket number
export const generateTicketNumber = () => {
  const prefix = 'ACD2025'
  const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${randomNumber}`
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
export const generateTicketHTML = (registrationData, qrCode) => {
  const { name, email, college, year, ticketNumber, _id } = registrationData
  
  return `
    <div style="max-width: 400px; margin: 20px auto; border: 2px solid #667eea; border-radius: 15px; overflow: hidden; font-family: Arial, sans-serif;">
      <!-- Ticket Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 24px;">🎫 EVENT TICKET</h2>
        <h3 style="margin: 5px 0; font-size: 18px;">ACD 2025</h3>
        <p style="margin: 5px 0; font-size: 14px;">January 29-30, 2026</p>
      </div>
      
      <!-- Ticket Body -->
      <div style="padding: 20px; background: white;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; padding: 10px; background: #f9f9f9; border-radius: 8px;">
            <!-- QR Code via CID (Content-ID) -->
            <img src="cid:ticket-qr-code" alt="Entry QR Code" style="display: block; width: 200px; height: 200px; border: none; border-radius: 4px;" />
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">Scan at venue entry</p>
          </div>
          <p style="font-size: 11px; color: #888; margin-top: 10px;">
            📱 Show this QR code at the venue for entry verification
          </p>
        </div>
        
        <div style="border-top: 2px dashed #ccc; padding-top: 15px;">
          <p style="margin: 5px 0; font-size: 16px;"><strong>Ticket #:</strong> ${ticketNumber}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>College:</strong> ${college}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Year:</strong> ${year}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>ID:</strong> ${_id}</p>
        </div>
        
        <div style="margin-top: 15px; padding: 10px; background: #f0f7ff; border-radius: 8px; border-left: 4px solid #667eea;">
          <p style="margin: 0; font-size: 12px; color: #555;">
            📍 <strong>Venue:</strong> To be announced<br>
            ⏰ <strong>Time:</strong> 9:00 AM onwards<br>
            📱 <strong>Instructions:</strong> Show this ticket at entry
          </p>
        </div>
      </div>
      
      <!-- Ticket Footer -->
      <div style="background: #f8f9fa; padding: 10px; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; font-size: 11px; color: #666;">
          Valid for ACD 2025 Event Only • Keep this ticket safe
        </p>
      </div>
    </div>
  `
}