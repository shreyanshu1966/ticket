// Professional Email Template for SHAKTI Event Tickets
// Enhanced with modern design, responsive layout, and comprehensive information
// Updated to use direct JPEG banner attachment instead of base64

function generateEmailTemplate(attendee, ticketId, qrCodeBuffer) {
    const qrCodeBase64 = qrCodeBuffer.toString('base64');
    const currentYear = new Date().getFullYear();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="format-detection" content="telephone=no">
    <meta name="x-apple-disable-message-reformatting">
    <title>SHAKTI ${currentYear} - Your Event Ticket</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 20px;
            margin: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        .email-container {
            max-width: 700px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            width: 100%;
            box-sizing: border-box;
        }
        
        .header {
            position: relative;
            text-align: center;
            padding: 0;
            background: #ffffff;
        }
        
        .banner-image {
            width: 100%;
            height: auto;
            display: block;
            border-radius: 20px 20px 0 0;
            max-width: 100%;
            object-fit: cover;
        }
        
        .content {
            padding: 40px 30px;
            box-sizing: border-box;
        }
        
        .greeting {
            font-size: 1.1rem;
            margin-bottom: 25px;
            color: #2c3e50;
        }
        
        .confirmation-message {
            background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
            border-left: 5px solid #4caf50;
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
        }
        
        .confirmation-message h3 {
            color: #2e7d32;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .ticket-section {
            background: #f8f9ff;
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            border: 2px solid #e1e8ff;
        }
        
        .section-title {
            color: #667eea;
            font-size: 1.3rem;
            font-weight: bold;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            box-sizing: border-box;
            min-width: 0; /* Prevent overflow */
        }
        
        .info-label {
            font-weight: 600;
            color: #555;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 1.1rem;
            color: #2c3e50;
            font-weight: 500;
        }
        
        .ticket-id-highlight {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 1.2rem;
            font-weight: bold;
            letter-spacing: 1px;
            margin: 20px 0;
            word-break: break-all;
            overflow-wrap: break-word;
            hyphens: auto;
        }
        
        .qr-section {
            text-align: center;
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .qr-code-container {
            background: white;
            display: inline-block;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        
        .qr-code-img {
            max-width: 200px;
            height: auto;
            border-radius: 10px;
        }
        
        .instructions-section {
            background: linear-gradient(135deg, #fff3e0 0%, #ffeccf 100%);
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            border-left: 5px solid #ff9800;
        }
        
        .instructions-title {
            color: #ef6c00;
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .instructions-list {
            list-style: none;
            padding: 0;
        }
        
        .instructions-list li {
            padding: 8px 0;
            padding-left: 30px;
            position: relative;
            color: #d84315;
            font-weight: 500;
        }
        
        .instructions-list li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #ff9800;
            font-weight: bold;
            font-size: 1.2rem;
        }
        
        .event-details {
            background: linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%);
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            border-left: 5px solid #2196f3;
        }
        
        .contact-section {
            background: #f5f5f5;
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
            margin: 15px 0;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #555;
            font-weight: 500;
            word-break: break-word;
            min-width: 0;
        }
        
        .footer {
            background: #2c3e50;
            color: white;
            text-align: center;
            padding: 30px;
        }
        
        .footer-content {
            margin-bottom: 20px;
        }
        
        .team-signature {
            font-size: 1.1rem;
            margin-bottom: 10px;
        }
        
        .divider {
            height: 1px;
            background: rgba(255,255,255,0.3);
            margin: 20px 0;
        }
        
        .copyright {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .social-links {
            margin: 15px 0;
        }
        
        .social-links a {
            color: white;
            text-decoration: none;
            margin: 0 10px;
            font-weight: 500;
        }
        
        .social-links a:hover {
            opacity: 0.8;
        }
        
        /* Mobile Responsiveness */
        @media (max-width: 600px) {
            body {
                padding: 10px !important;
            }
            
            .email-container {
                margin: 5px !important;
                border-radius: 15px;
                max-width: 100% !important;
            }
            
            .banner-image {
                border-radius: 15px 15px 0 0;
            }
            
            .content {
                padding: 20px 15px !important;
            }
            
            .greeting {
                font-size: 1rem !important;
                margin-bottom: 20px;
            }
            
            .section-title {
                font-size: 1.1rem !important;
                margin-bottom: 15px;
            }
            
            .confirmation-message {
                padding: 15px !important;
                margin: 20px 0 !important;
            }
            
            .confirmation-message h3 {
                font-size: 1.1rem !important;
                margin-bottom: 8px;
            }
            
            .confirmation-message p {
                font-size: 0.9rem !important;
                line-height: 1.5;
            }
            
            .ticket-section, .qr-section, .event-details, .instructions-section, .contact-section {
                padding: 20px 15px !important;
                margin: 20px 0 !important;
                border-radius: 12px;
            }
            
            .info-grid {
                grid-template-columns: 1fr !important;
                gap: 12px;
            }
            
            .info-item {
                padding: 12px !important;
                border-radius: 8px;
            }
            
            .info-label {
                font-size: 0.8rem !important;
            }
            
            .info-value {
                font-size: 1rem !important;
            }
            
            .ticket-id-highlight {
                font-size: 0.9rem !important;
                padding: 12px !important;
                letter-spacing: 0.5px;
                word-break: break-all;
                line-height: 1.3;
            }
            
            .qr-section {
                padding: 20px 10px !important;
            }
            
            .qr-code-container {
                padding: 15px !important;
                margin: 15px 0 !important;
            }
            
            .qr-code-img {
                max-width: 180px !important;
                height: auto;
            }
            
            .event-details div {
                font-size: 0.9rem !important;
                line-height: 1.6 !important;
            }
            
            .event-details p {
                margin: 8px 0 !important;
            }
            
            .instructions-section {
                padding: 15px !important;
            }
            
            .instructions-title {
                font-size: 1rem !important;
                margin-bottom: 12px;
            }
            
            .instructions-list li {
                font-size: 0.85rem !important;
                padding: 6px 0;
                padding-left: 25px;
                line-height: 1.4;
            }
            
            .instructions-list li::before {
                font-size: 1rem !important;
            }
            
            .contact-section {
                padding: 15px !important;
            }
            
            .contact-section h3 {
                font-size: 1.1rem !important;
                margin-bottom: 15px;
            }
            
            .contact-info {
                flex-direction: column !important;
                gap: 12px !important;
                align-items: flex-start;
            }
            
            .contact-item {
                font-size: 0.9rem !important;
                width: 100%;
                justify-content: flex-start;
            }
            
            .contact-item span:first-child {
                min-width: 30px;
            }
            
            .footer {
                padding: 20px 15px !important;
            }
            
            .footer-content {
                margin-bottom: 15px;
            }
            
            .team-signature {
                font-size: 1rem !important;
                margin-bottom: 8px;
            }
            
            .social-links {
                margin: 12px 0;
            }
            
            .social-links a {
                margin: 0 8px;
                font-size: 0.9rem;
            }
            
            .copyright {
                font-size: 0.8rem !important;
            }
            
            .copyright p {
                margin: 5px 0;
            }
        }
        
        /* Extra Small Mobile Devices */
        @media (max-width: 400px) {
            body {
                padding: 5px !important;
            }
            
            .email-container {
                margin: 0 !important;
                border-radius: 10px;
            }
            
            .content {
                padding: 15px 10px !important;
            }
            
            .section-title {
                font-size: 1rem !important;
            }
            
            .confirmation-message, .ticket-section, .qr-section, .event-details, .instructions-section, .contact-section {
                padding: 15px 10px !important;
                margin: 15px 0 !important;
            }
            
            .info-item {
                padding: 10px !important;
            }
            
            .ticket-id-highlight {
                font-size: 0.8rem !important;
                padding: 10px !important;
            }
            
            .qr-code-img {
                max-width: 160px !important;
            }
            
            .instructions-list li {
                font-size: 0.8rem !important;
                padding-left: 20px;
            }
            
            .contact-item {
                font-size: 0.85rem !important;
            }
            
            .footer {
                padding: 15px 10px !important;
            }
        }
        
        /* Tablet Responsiveness */
        @media (min-width: 601px) and (max-width: 900px) {
            .email-container {
                margin: 15px auto;
                max-width: 650px;
            }
            
            .content {
                padding: 35px 25px;
            }
            
            .info-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
            
            .qr-code-img {
                max-width: 220px;
            }
        }
        
        /* Print Styles */
        @media print {
            body {
                background: white !important;
            }
            
            .email-container {
                box-shadow: none !important;
                max-width: 100% !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="cid:banner" alt="SHAKTI Event Banner" class="banner-image">
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear <strong>${attendee.Name}</strong>,
            </div>
            
            <div class="confirmation-message">
                <h3>🎉 Registration Confirmed!</h3>
                <p>We're thrilled to confirm your registration for SHAKTI ${currentYear} - Celebrate Naari Shakti this Navratri! Get ready for a spectacular day filled with dance, music, drama, and cultural performances. Your digital ticket has been generated and is ready for use.</p>
            </div>
            
            <div class="ticket-section">
                <h3 class="section-title">📋 Attendee Information</h3>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Full Name</div>
                        <div class="info-value">${attendee.Name}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email Address</div>
                        <div class="info-value">${attendee['Email id']}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Institution</div>
                        <div class="info-value">${attendee.College || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Department</div>
                        <div class="info-value">${attendee.Department || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Academic Year</div>
                        <div class="info-value">${attendee.Year || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Contact Number</div>
                        <div class="info-value">${attendee.Phone || 'N/A'}</div>
                    </div>
                </div>
                
                <h4 style="margin: 25px 0 15px 0; color: #667eea;">🎟️ Your Unique Ticket ID</h4>
                <div class="ticket-id-highlight">${ticketId}</div>
            </div>
            
            <div class="qr-section">
                <h3 class="section-title">📱 Digital Entry Pass</h3>
                <p style="margin-bottom: 20px; color: #666;">Present this QR code at the event entrance for instant verification</p>
                
                <div class="qr-code-container">
                    <img src="cid:qrcode" alt="Event Entry QR Code" class="qr-code-img">
                </div>
                
                <p style="font-size: 0.9rem; color: #888; margin-top: 15px;">
                    <strong>Note:</strong> Screenshots and printed versions are equally valid
                </p>
            </div>
            
            <div class="event-details">
                <h3 class="section-title">📅 Event Information</h3>
                <div style="color: #1976d2; font-weight: 500; line-height: 1.8;">
                    <p><strong>🎭 Event:</strong> SHAKTI ${currentYear} - Celebrate Naari Shakti this Navratri</p>
                    <p style="margin: 10px 0; font-style: italic; color: #e91e63;">A tribute to women's strength, courage & creativity</p>
                    <p><strong>📅 Date:</strong> 7th October ${currentYear}</p>
                    <p><strong>📍 Venue:</strong> Urmila Tai Karad Auditorium</p>
                    <p><strong>🎯 Theme:</strong> One-day cultural celebration by ACES × IGNITE</p>
                    <p><strong>🎪 Highlights:</strong> Dance, Music, Drama, Ramp Walk & Poetry competitions</p>
                    <p><strong>🏆 Prizes:</strong> Cash Prizes + Trophies + Refreshments</p>
                    <p><strong>🎟️ Special:</strong> Chance to WIN FREE IMAGICAA Tickets!</p>
                    <div style="margin-top: 20px; padding: 15px; background: rgba(233, 30, 99, 0.1); border-radius: 10px; border-left: 4px solid #e91e63;">
                        <p style="margin: 0; font-weight: bold; color: #c2185b;">मातृशक्ति: विश्वस्य जीवनम् ⚡</p>
                        <p style="margin: 5px 0 0 0; font-size: 0.95rem;">"Because When Women Rise, the World Rises ✨"</p>
                    </div>
                </div>
            </div>
            
            <div class="instructions-section">
                <h3 class="instructions-title">📋 Important Guidelines</h3>
                <ul class="instructions-list">
                    <li>Arrive at least 30 minutes before the event commencement</li>
                    <li>Present your QR code (digital or printed) at the registration desk</li>
                    <li>Mobile screenshots of the QR code are completely acceptable</li>
                    <li>Dress Code: Festive/Cultural attire encouraged (Navratri theme)</li>
                    <li>Refreshments  will be provided</li>
                    <li>Join our WhatsApp group for live updates and community engagement</li>
                    <li>Photography and social media sharing encouraged with #SHAKTI${currentYear}</li>
                    <li>Participate in competitions and stand a chance to win amazing prizes!</li>
                </ul>
            </div>
            
            <div class="contact-section">
                <h3 style="color: #333; margin-bottom: 20px;">📞 Need Assistance?</h3>
                <p style="margin-bottom: 15px; color: #666;">Our support team is here to help you with any questions or concerns.</p>
                
                <div class="contact-info">
                    <div class="contact-item">
                        <span>�</span>
                        <span>Shivansh – 9084134537</span>
                    </div>
                    <div class="contact-item">
                        <span>📱</span>
                        <span>Vedika – 9326824815</span>
                    </div>
                    <div class="contact-item">
                        <span>🌐</span>
                        <span>WhatsApp Group: https://chat.whatsapp.com/LSoSVdHx0cz1FfvCh3eDqk</span>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin: 40px 0; color: #667eea; font-size: 1.1rem;">
                <strong>We're excited to see you at SHAKTI ${currentYear}!</strong><br>
                <em>Get ready for an inspiring day of culture, creativity, and celebration of Naari Shakti.</em><br>
                <span style="color: #e91e63; font-weight: bold; margin-top: 10px; display: block;">🎭 Empower • Express • Inspire 🎭</span>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-content">
                <div class="team-signature">
                    <strong>Best Regards,</strong><br>
                    The SHAKTI ${currentYear} Organizing Committee
                </div>
                
                <div class="social-links">
                    <a href="#">LinkedIn</a> •
                    <a href="#">Twitter</a> •
                    <a href="#">Instagram</a> •
                    <a href="#">Website</a>
                </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="copyright">
                <p>© ${currentYear} SHAKTI Technology Event. All rights reserved.</p>
                <p style="font-size: 0.8rem; margin-top: 5px; opacity: 0.7;">
                    This is an automated email. Please do not reply to this address.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

// Export with the correct function name that the sender scripts expect
function generateTicketTemplate(attendee, qrCodeBase64, ticketId) {
    return generateEmailTemplate(attendee, ticketId, Buffer.from(qrCodeBase64, 'base64'));
}

module.exports = { generateEmailTemplate, generateTicketTemplate };