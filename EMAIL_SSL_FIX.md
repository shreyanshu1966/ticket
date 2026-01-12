# Email Configuration Fix - SSL/TLS Error Resolution

## Problem
You were experiencing this error when sending emails:
```
❌ Failed to send email: 40130000:error:0A00010B:SSL routines:tls_validate_record_header:wrong version number
```

## Root Cause
The nodemailer configuration was using `ciphers: 'SSLv3'` which is:
- **Outdated**: SSLv3 is deprecated and insecure
- **Incompatible**: Modern email servers don't support SSLv3
- **Causing version mismatch**: The server expects TLS 1.2+ but was receiving SSLv3

## Solution Applied
Changed the TLS configuration in `backend/config/nodemailer.js`:

### Before:
```javascript
tls: {
  rejectUnauthorized: false,
  ciphers: 'SSLv3' // ❌ WRONG - Outdated and causes errors
}
```

### After:
```javascript
tls: {
  rejectUnauthorized: false,
  minVersion: 'TLSv1.2' // ✅ CORRECT - Modern TLS version
}
```

## What Changed
- **Removed**: `ciphers: 'SSLv3'` (outdated SSL version)
- **Added**: `minVersion: 'TLSv1.2'` (modern TLS version)
- **Kept**: `rejectUnauthorized: false` (for self-signed certificates)

## How to Test

### 1. Restart Backend Server
The backend server needs to be restarted to apply the changes:

```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
npm start
```

### 2. Test Email Sending
Try sending a test email or bulk notification again. The SSL error should be resolved.

### 3. Expected Output
You should now see:
```
✅ Email server is ready to send messages
✅ Bulk email sent to user@example.com: <message-id>
```

Instead of:
```
❌ Failed to send email: SSL routines error
```

## Email Configuration Reference

### Current Setup (Port 587 - STARTTLS)
```javascript
{
  host: 'mail.acesmitadt.com',
  port: 587,
  secure: false,  // false for STARTTLS
  requireTLS: true,  // Require STARTTLS upgrade
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  }
}
```

### Alternative Setup (Port 465 - Implicit SSL)
If port 587 doesn't work, you can try port 465:

**In your .env file:**
```
EMAIL_PORT=465
```

**This will automatically use:**
```javascript
{
  host: 'mail.acesmitadt.com',
  port: 465,
  secure: true,  // true for implicit SSL
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  }
}
```

## Common Email Ports

| Port | Protocol | Security | Use Case |
|------|----------|----------|----------|
| 25 | SMTP | None | Server-to-server (often blocked) |
| 587 | SMTP | STARTTLS | **Recommended** - Modern standard |
| 465 | SMTPS | Implicit SSL | Legacy but still widely used |
| 2525 | SMTP | STARTTLS | Alternative to 587 (if blocked) |

## TLS Versions Explained

| Version | Status | Security |
|---------|--------|----------|
| SSLv2 | ❌ Deprecated | Insecure - DO NOT USE |
| SSLv3 | ❌ Deprecated | Insecure - DO NOT USE |
| TLSv1.0 | ⚠️ Legacy | Weak - Avoid if possible |
| TLSv1.1 | ⚠️ Legacy | Weak - Avoid if possible |
| **TLSv1.2** | ✅ Current | **Secure - Recommended** |
| TLSv1.3 | ✅ Latest | Secure - Best option |

## Troubleshooting

### If emails still fail after the fix:

#### 1. Check Email Credentials
Make sure your `.env` file has correct credentials:
```
EMAIL_HOST=mail.acesmitadt.com
EMAIL_PORT=587
EMAIL_USER=your-email@acesmitadt.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@acesmitadt.com
```

#### 2. Try Different Port
If port 587 doesn't work, try 465:
```
EMAIL_PORT=465
```

#### 3. Enable Debug Mode
Add to your `.env`:
```
DEBUG_EMAIL=true
```

This will show detailed email logs.

#### 4. Test Connection
You can test the email configuration by sending a test email through the admin panel or using this endpoint:
```
POST /api/admin/test-email
```

#### 5. Check Firewall
Ensure your firewall/network allows outbound connections on port 587 or 465.

#### 6. Verify Email Server Settings
Contact your email provider (acesmitadt.com) to confirm:
- Correct SMTP server address
- Correct port (587 or 465)
- Whether STARTTLS or SSL is required
- If your IP needs to be whitelisted

## Security Notes

### `rejectUnauthorized: false`
This setting is currently set to `false` to allow self-signed certificates. 

**For Production:**
- If your email server has a valid SSL certificate, set this to `true`
- This provides better security by validating the server's certificate

**Current setting (development):**
```javascript
rejectUnauthorized: false  // Allows self-signed certs
```

**Recommended for production:**
```javascript
rejectUnauthorized: true  // Validates SSL certificates
```

## Next Steps

1. ✅ **Restart your backend server** to apply the changes
2. ✅ **Test sending emails** through the admin panel
3. ✅ **Monitor the logs** for any remaining errors
4. ✅ **Update production .env** with correct email settings

## Success Indicators

After the fix, you should see:
- ✅ No more SSL/TLS version errors
- ✅ Emails sending successfully
- ✅ "Email server is ready" message on startup
- ✅ Bulk emails working without SSL errors

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [SMTP Port Guide](https://www.mailgun.com/blog/which-smtp-port-understanding-ports-25-465-587/)
- [TLS Best Practices](https://nodejs.org/api/tls.html)

---

**Status**: ✅ Fixed - Please restart your backend server to apply changes
