# Email Configuration Guide

## Overview
The system now supports **dual email configuration**:
1. **Main Email** - Used for ticketing and registration confirmation emails
2. **Noreply Email** - Used for bulk notifications and automated messages

## Configuration

### 1. Main Email (Ticketing & Registration)
This email is used for important transactional emails like tickets and registration confirmations.

```env
EMAIL_HOST=mail.acesmitadt.com
EMAIL_PORT=587
EMAIL_USER=your-main-email@acesmitadt.com
EMAIL_PASSWORD=your-main-password
EMAIL_FROM=your-main-email@acesmitadt.com
```

**Recommended Settings:**
- Port: 587 (STARTTLS)
- Secure: false (STARTTLS will upgrade the connection)

### 2. Noreply Email (Notifications)
This email is used for bulk notifications and automated messages.

```env
NOREPLY_EMAIL_HOST=mail.acesmitadt.com
NOREPLY_EMAIL_PORT=587
NOREPLY_EMAIL_USER=noreply@acesmitadt.com
NOREPLY_EMAIL_PASSWORD=your-noreply-password
```

**Settings:**
- Port: 587 (STARTTLS)
- Secure: false (STARTTLS will upgrade the connection)
- Username: noreply@acesmitadt.com

## Email Usage Breakdown

### Main Email (`transporter`) is used for:
- ✅ Registration confirmation emails
- ✅ E-Ticket emails with QR codes
- ✅ Test emails

### Noreply Email (`noreplyTransporter`) is used for:
- 📧 Pending payment reminder emails (with designed template)
- 📢 Bulk notification emails
- 📢 Mass announcements
- 📢 Automated system notifications

## Setup Instructions

### Step 1: Update your `.env` file
Add the following configuration to your `.env` file (not tracked by git):

```env
# Main Email Configuration
EMAIL_HOST=mail.acesmitadt.com
EMAIL_PORT=587
EMAIL_USER=your-main-email@acesmitadt.com
EMAIL_PASSWORD=your-main-password
EMAIL_FROM=your-main-email@acesmitadt.com

# Noreply Email Configuration
NOREPLY_EMAIL_HOST=mail.acesmitadt.com
NOREPLY_EMAIL_PORT=587
NOREPLY_EMAIL_USER=noreply@acesmitadt.com
NOREPLY_EMAIL_PASSWORD=your-noreply-password
```

### Step 2: Replace placeholders
- Replace `your-main-email@acesmitadt.com` with your actual main email address
- Replace `your-main-password` with your main email password
- Replace `your-noreply-password` with the password for noreply@acesmitadt.com

### Step 3: Restart your server
```bash
npm run dev
```

### Step 4: Verify configuration
When the server starts, you should see:
```
📧 Configuring main email: mail.acesmitadt.com:587 (secure: false)
📧 Configuring noreply email: mail.acesmitadt.com:587 (secure: false)
✅ Main email server is ready to send messages
✅ Noreply email server is ready to send messages
```

## Manual Email Settings Reference

### Noreply Email - Secure STARTTLS Settings
```
Username:     noreply@acesmitadt.com
Password:     Use the email account's password
Incoming:     mail.acesmitadt.com
IMAP Port:    993
POP3 Port:    995
Outgoing:     mail.acesmitadt.com
SMTP Port:    587 (STARTTLS)
```

### Alternative SSL Settings
```
SMTP Port:    465 (SSL/TLS - if needed)
```

## Troubleshooting

### Issue: Noreply email not sending
1. Verify the password is correct
2. Check that port 587 is not blocked by firewall
3. Enable debug mode: `DEBUG_EMAIL=true` in `.env`

### Issue: Main email not sending
1. Verify the password is correct
2. Check that port 587 is not blocked by firewall
3. Try switching to port 465 if 587 doesn't work

### Issue: Authentication errors
- Double-check username and password
- Ensure the email account exists and is active
- Check if the email service requires app-specific passwords

## Testing

### Test Main Email
Use the test email endpoint to verify main email configuration.

### Test Noreply Email
Send a bulk notification to test the noreply email configuration.

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to version control
- Use strong, unique passwords for both email accounts
- Regularly rotate email passwords
- Monitor email sending logs for suspicious activity
- Consider implementing rate limiting for bulk emails

## Support

For email configuration issues, contact:
- **Aayush:** 9226750350
- **Ishan:** 9552448038
- **Email:** mail@acesmitadt.com
