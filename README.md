# SHAKTI Event Ticket Sender 🎫

An automated Node.js application to send personalized event tickets with QR codes to attendees via email.

## 📋 Features

- ✅ Reads attendee data from CSV file
- ✅ Generates unique QR codes for each attendee
- ✅ Sends beautifully designed HTML email tickets
- ✅ Uses your custom email configuration (acesmitadt.com)
- ✅ Handles large attendee lists with rate limiting
- ✅ Comprehensive error handling and reporting
- ✅ Email configuration testing
- ✅ Professional ticket design with event details

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Email Settings

Edit the `.env` file and add your email password:

```env
EMAIL_PASS=your_actual_email_password_here
```

**Important:** Replace `your_actual_email_password_here` with the actual password for `official@acesmitadt.com`

### 3. Test Email Configuration

```bash
npm test
```

This will verify your email settings and send a test email.

### 4. Send Tickets to All Attendees

```bash
npm start
```

## 📁 Project Structure

```
ticket/
├── package.json              # Project dependencies
├── .env                      # Email configuration (add your password here)
├── config.js                 # Application configuration
├── send-tickets.js           # Main ticket sender script
├── email-template.js         # HTML email template
├── test-email.js            # Email configuration tester
├── README.md                # This documentation
└── SHAKTI ATTENDEES - Form responses 1.csv  # Attendee data
```

## ⚙️ Configuration

### Email Settings (.env file)

```env
# Email Configuration
EMAIL_USER=official@acesmitadt.com
EMAIL_PASS=your_email_password_here  # ⚠️ REQUIRED: Add your actual password
EMAIL_HOST=acesmitadt.com
EMAIL_PORT=465
EMAIL_SECURE=true

# Event Configuration
EVENT_NAME=SHAKTI
EVENT_DATE=2025-10-15
EVENT_TIME=10:00 AM
EVENT_VENUE=MIT Academy of Engineering, Alandi
ORGANIZER=ACES MIT ADT
```

### CSV File Format

The script expects a CSV file with these columns:
- `Name` - Attendee's full name
- `Email id` - Attendee's email address
- `Contact no.` - Phone number
- `Department and branch` - Academic department
- `Year` - Academic year
- `Division` - Division/section

## 🎫 Ticket Features

Each ticket includes:

- **Personalized Information**: Name, email, department, year, division
- **Event Details**: Date, time, venue, organizer
- **Unique QR Code**: Contains encrypted attendee and event data
- **Professional Design**: Responsive HTML email template
- **Security**: Unique ticket ID with timestamp

## 🔧 Usage Instructions

### Step 1: Prepare Your Environment

1. **Install Node.js** (version 14 or higher)
2. **Install dependencies**: `npm install`
3. **Add your email password** to the `.env` file

### Step 2: Test Email Configuration

```bash
npm test
```

Expected output:
```
🧪 Testing Email Configuration
==============================
✅ SMTP connection verified successfully!
✅ Test email sent successfully!
🎉 Email configuration is working perfectly!
```

### Step 3: Send Tickets

```bash
npm start
```

The script will:
1. Read all attendees from the CSV file
2. Generate unique QR codes for each attendee
3. Send personalized email tickets
4. Display progress and final summary

### Sample Output:
```
🎫 SHAKTI Event Ticket Sender
===============================

✅ Email transporter initialized successfully
📧 Using email: official@acesmitadt.com
🖥️  SMTP Server: acesmitadt.com:465
👥 Found 282 attendees

🚀 Starting to send tickets...

✅ Ticket sent to Dhanashri Zodage (dhanashrizodage19@gmail.com)
✅ Ticket sent to Anushka Ganesh Todarmal (anushkatodarmal@gmail.com)
...

==================================================
📊 TICKET SENDING SUMMARY
==================================================
✅ Successfully sent: 282 tickets
❌ Failed to send: 0 tickets
📧 Total processed: 282 attendees

🎉 Ticket sending process completed!
```

## 🎨 Email Template Features

The email tickets include:

- **Responsive Design**: Works on desktop and mobile
- **Professional Styling**: Gradient backgrounds and modern typography
- **QR Code Integration**: Embedded QR code for easy scanning
- **Event Information**: Complete event details
- **Instructions**: Clear guidelines for attendees
- **Security Features**: Unique ticket IDs and timestamps

## 🔒 Security & Privacy

- **Data Protection**: Attendee data is only used for ticket generation
- **Secure Email**: Uses SSL/TLS encryption for email transmission
- **Unique QR Codes**: Each QR code contains encrypted attendee information
- **No Data Storage**: No attendee data is stored permanently

## 🛠️ Troubleshooting

### Common Issues:

**1. Email Authentication Failed**
```
Solution: Verify your email password in the .env file
```

**2. SMTP Connection Timeout**
```
Solution: Check firewall settings and network connectivity
```

**3. CSV File Not Found**
```
Solution: Ensure the CSV file is in the correct location
```

**4. Some Emails Failed to Send**
```
Solution: Check the error summary for specific email addresses
```

### Getting Help:

1. **Run the test script**: `npm test` to verify configuration
2. **Check the console output** for detailed error messages
3. **Verify CSV file format** matches the expected columns
4. **Ensure email password** is correctly set in `.env`

## 📧 Email Provider Settings

Your current configuration uses:
- **Host**: acesmitadt.com
- **Port**: 465 (SSL/TLS)
- **Authentication**: Required
- **Security**: SSL/TLS encryption

## 🎯 Customization

### Modify Event Details
Edit `config.js` or `.env` file to change:
- Event name, date, time, venue
- Email settings
- QR code size and format

### Customize Email Template
Edit `email-template.js` to modify:
- Colors, fonts, and styling
- Layout and content
- Additional attendee information

### Add New Features
The modular design allows easy extension:
- Add attachment support
- Include calendar invites
- Add SMS notifications
- Integrate with databases

## 📊 Performance

- **Rate Limiting**: 1-second delay between emails to prevent server overload
- **Batch Processing**: Handles large attendee lists efficiently
- **Error Recovery**: Continues processing even if some emails fail
- **Memory Efficient**: Processes attendees one at a time

## 🎉 Success Tips

1. **Test First**: Always run `npm test` before sending to all attendees
2. **Check Email Limits**: Verify your email provider's sending limits
3. **Monitor Progress**: Watch the console output during sending
4. **Backup Data**: Keep a backup of your CSV file
5. **Verify Recipients**: Ensure email addresses are valid

---

## 📞 Support

For technical support or questions:
- **Email**: official@acesmitadt.com
- **Organization**: ACES MIT ADT

**Happy Event Management! 🎊**