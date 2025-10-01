// email-template.js - HTML email template for tickets
const config = require('./config');

function generateTicketTemplate(attendee, qrCodeBase64, ticketId) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SHAKTI Event Ticket</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .ticket-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .event-title {
            font-size: 2.5em;
            font-weight: bold;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .event-subtitle {
            font-size: 1.2em;
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .ticket-body {
            padding: 40px 30px;
        }
        .attendee-info {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
            border-left: 5px solid #667eea;
        }
        .attendee-name {
            font-size: 1.5em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .attendee-details {
            color: #7f8c8d;
            line-height: 1.6;
        }
        .event-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .detail-item {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        .detail-label {
            font-size: 0.9em;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        .detail-value {
            font-size: 1.1em;
            font-weight: bold;
            color: #2c3e50;
        }
        .qr-section {
            text-align: center;
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
        }
        .qr-title {
            font-size: 1.3em;
            color: #2c3e50;
            margin-bottom: 15px;
            font-weight: bold;
        }
        .qr-code {
            background: white;
            padding: 20px;
            border-radius: 15px;
            display: inline-block;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .ticket-id {
            font-family: 'Courier New', monospace;
            font-size: 1.1em;
            color: #7f8c8d;
            margin-top: 15px;
            letter-spacing: 2px;
        }
        .instructions {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 10px;
            border-left: 5px solid #27ae60;
            margin-bottom: 20px;
        }
        .instructions h3 {
            color: #27ae60;
            margin-top: 0;
        }
        .footer {
            background: #34495e;
            color: white;
            padding: 25px;
            text-align: center;
        }
        .contact-info {
            margin-top: 15px;
            font-size: 0.9em;
            opacity: 0.8;
        }
        @media (max-width: 600px) {
            .event-details {
                grid-template-columns: 1fr;
            }
            .ticket-body {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <div class="header">
            <h1 class="event-title">${config.event.name}</h1>
            <p class="event-subtitle">Your Digital Event Ticket</p>
        </div>
        
        <div class="ticket-body">
            <div class="attendee-info">
                <div class="attendee-name">🎫 ${attendee.Name}</div>
                <div class="attendee-details">
                    <strong>📧 Email:</strong> ${attendee['Email id']}<br>
                    <strong>📱 Contact:</strong> ${attendee['Contact no. ']}<br>
                    <strong>🏫 Department:</strong> ${attendee['Department and branch']}<br>
                    <strong>📚 Year:</strong> ${attendee['Year ']} | <strong>📋 Division:</strong> ${attendee.Division}
                </div>
            </div>

            <div class="event-details">
                <div class="detail-item">
                    <div class="detail-label">📅 Date</div>
                    <div class="detail-value">${config.event.date}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">🕐 Time</div>
                    <div class="detail-value">${config.event.time}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">📍 Venue</div>
                    <div class="detail-value">${config.event.venue}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">🏢 Organizer</div>
                    <div class="detail-value">${config.event.organizer}</div>
                </div>
            </div>

            <div class="qr-section">
                <div class="qr-title">🎫 Your Entry QR Code</div>
                <div class="qr-code">
                    <img src="data:image/png;base64,${qrCodeBase64}" alt="QR Code" style="display: block;">
                </div>
                <div class="ticket-id">Ticket ID: ${ticketId}</div>
            </div>

            <div class="instructions">
                <h3>📋 Important Instructions</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Please arrive 30 minutes before the event starts</li>
                    <li>Show this QR code at the entrance for quick check-in</li>
                    <li>Keep this email accessible on your mobile device</li>
                    <li>Carry a valid ID proof along with this ticket</li>
                    <li>This ticket is non-transferable and valid for one person only</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p><strong>Thank you for registering for ${config.event.name}!</strong></p>
            <p>We look forward to seeing you at the event! 🎉</p>
            <div class="contact-info">
                For any queries, contact us at: ${config.sender.email}<br>
                Organized by: ${config.event.organizer}
            </div>
        </div>
    </div>
</body>
</html>`;
}

module.exports = { generateTicketTemplate };