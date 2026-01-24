# Email Accounts Configuration

This document outlines the three different email accounts used in the ACD 2026 event registration system, each serving a specific purpose.

## 📧 Email Account Overview

| Email Account | Purpose | Usage | Transporter |
|--------------|---------|-------|-------------|
| **mail@acesmitadt.com** | Tickets & Registration | Sending event tickets and registration confirmations | `transporter` (main) |
| **noreply@acesmitadt.com** | Notifications | System notifications and updates | `noreplyTransporter` |
| **no.reply@acesmitadt.com** | OTP Verification | Sending one-time passwords (OTPs) | `otpTransporter` |

## 🔧 Configuration Details

### 1. Main Email (mail@acesmitadt.com)
**Purpose:** Tickets and Registration Confirmations

```env
EMAIL_HOST=mail.acesmitadt.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=mail@acesmitadt.com
EMAIL_PASSWORD=Aces@2025
EMAIL_FROM=ACES <mail@acesmitadt.com>
```

**Used for:**
- Sending event tickets
- Registration confirmation emails
- Payment confirmation emails
- Friend registration confirmations

### 2. Noreply Email (noreply@acesmitadt.com)
**Purpose:** Notifications

```env
NOREPLY_EMAIL_HOST=mail.acesmitadt.com
NOREPLY_EMAIL_PORT=587
NOREPLY_EMAIL_USER=noreply@acesmitadt.com
NOREPLY_EMAIL_PASSWORD=Aces@2025noreply
```

**Used for:**
- System notifications
- Admin notifications
- General updates

### 3. OTP Email (no.reply@acesmitadt.com)
**Purpose:** OTP Verification

```env
OTP_EMAIL_HOST=mail.acesmitadt.com
OTP_EMAIL_PORT=465
OTP_EMAIL_USER=no.reply@acesmitadt.com
OTP_EMAIL_PASSWORD=YOUR_OTP_EMAIL_PASSWORD_HERE
```

**SSL/TLS Settings (Recommended):**
- Username: `no.reply@acesmitadt.com`
- Password: Use the email account's password
- Incoming Server: `mail.acesmitadt.com`
  - IMAP Port: 993
  - POP3 Port: 995
- Outgoing Server: `mail.acesmitadt.com`
  - SMTP Port: 465 (SSL)
- Authentication: Required for IMAP, POP3, and SMTP

**Non-SSL Settings (NOT Recommended):**
- IMAP Port: 143
- POP3 Port: 110
- SMTP Port: 587

**Used for:**
- Friend referral OTP verification
- Account verification OTPs
- Password reset OTPs (if implemented)

## 📝 Implementation

### In `nodemailer.js`:

```javascript
// Main transporter (mail@acesmitadt.com) - for tickets
const transporter = nodemailer.createTransport({...})

// Noreply transporter (noreply@acesmitadt.com) - for notifications
export const noreplyTransporter = nodemailer.createTransport({...})

// OTP transporter (no.reply@acesmitadt.com) - for OTPs
export const otpTransporter = nodemailer.createTransport({...})
```

### In `emailService.js`:

```javascript
import transporter, { noreplyTransporter, otpTransporter } from '../config/nodemailer.js'

// Use otpTransporter for OTP emails
export const sendFriendOTPEmail = async (email, userName, otp) => {
  // ...
  const info = await otpTransporter.sendMail(mailOptions)
  // ...
}

// Use main transporter for tickets
export const sendTicketEmail = async (registration) => {
  // ...
  const info = await transporter.sendMail(mailOptions)
  // ...
}

// Use noreplyTransporter for notifications
export const sendNotification = async (...) => {
  // ...
  const info = await noreplyTransporter.sendMail(mailOptions)
  // ...
}
```

## ✅ Setup Checklist

- [x] Configure main email (mail@acesmitadt.com) in `.env`
- [x] Configure noreply email (noreply@acesmitadt.com) in `.env`
- [ ] **Configure OTP email (no.reply@acesmitadt.com) password in `.env`**
- [x] Create three transporters in `nodemailer.js`
- [x] Update `sendFriendOTPEmail` to use `otpTransporter`
- [x] Import `otpTransporter` in `emailService.js`
- [ ] Test OTP email sending
- [ ] Verify all three email accounts are working

## 🧪 Testing

### Test Main Email:
```bash
# Send a test ticket email
node backend/send_test_ticket.js
```

### Test OTP Email:
```bash
# Try friend referral process
# Go to /bring-friend route and verify eligibility
# OTP will be sent via no.reply@acesmitadt.com
```

### Test Noreply Email:
```bash
# Admin notifications use noreply email
# Check notification emails in admin panel
```

## ⚠️ Important Notes

1. **Update the OTP email password** in `.env` file with the actual password for `no.reply@acesmitadt.com`
2. **Port 465** is used for OTP email with SSL encryption (more secure)
3. **Port 587** is used for main and noreply emails with STARTTLS
4. All email accounts require authentication
5. Rate limiting is configured (1 email per 2 seconds per transporter)

## 🔐 Security Recommendations

1. Keep all email passwords secure and don't commit them to version control
2. Use environment variables for all sensitive data
3. Enable two-factor authentication on email accounts if possible
4. Regularly rotate email passwords
5. Monitor email sending logs for suspicious activity

## 📊 Email Flow Diagram

```
User Action → System → Email Account → Recipient
───────────────────────────────────────────────────
Registration → Ticket → mail@aces → User Email
Friend OTP → Verify → no.reply@aces → User Email
Notification → Alert → noreply@aces → Admin/User
```

## 🆘 Troubleshooting

### OTP emails not sending?
1. Check `.env` has correct `OTP_EMAIL_PASSWORD`
2. Verify port 465 is not blocked by firewall
3. Check email account authentication settings
4. Review logs: `✅ OTP email server is ready to send messages`

### Connection timeout?
- Increase timeout values in transporter config
- Check if email server is accessible
- Verify credentials are correct

### Rate limiting errors?
- Reduce `rateDelta` or increase `rateLimit`
- Check email provider's sending limits
- Monitor `maxMessages` and `maxConnections`
