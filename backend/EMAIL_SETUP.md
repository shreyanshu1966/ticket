# Email Setup Guide (Node Mailer)

## Gmail Configuration (Recommended)

### 1. Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled

### 2. Generate App Password
1. Go to Google Account → Security → 2-Step Verification
2. Scroll down to "App passwords"
3. Select "Mail" and generate a password
4. Copy the 16-character password

### 3. Update Environment Variables

Update your `.env` file in the backend folder:

```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=Event Registration <your-email@gmail.com>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

## Other Email Providers

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

### Custom SMTP
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password
```

## Testing Email Configuration

### 1. Start the backend server
```bash
cd backend
npm run dev
```

### 2. Test email endpoint
```bash
curl -X POST http://localhost:5000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 3. Check server logs
Look for either:
- ✅ Email server is ready to send messages
- ❌ Email configuration error

## Email Features

### Confirmation Email
- Automatically sent after successful payment verification
- Contains registration details and event information
- Professional HTML template with inline styles
- Plain text fallback for accessibility

### Email Content Includes:
- Registration confirmation with ID
- Payment details
- Event information
- Next steps for attendees
- Contact information

### Error Handling
- Email failures won't block registration completion
- Errors are logged but don't affect payment flow
- API response includes email status

## Troubleshooting

### Common Issues:

1. **"Invalid login"**: Check email and app password
2. **"Connection timeout"**: Check SMTP host and port
3. **"Authentication failed"**: Enable app passwords for Gmail
4. **"Message rejected"**: Check FROM email address format

### Debug Mode:
Add to your `.env` file:
```env
DEBUG_EMAIL=true
```

This will log detailed email sending information.

## Security Notes

- Never commit `.env` files to version control
- Use app passwords instead of account passwords
- Keep email credentials secure
- Monitor email usage for suspicious activity
- Consider using dedicated email service for production

## Production Recommendations

For production deployments:
- Use services like SendGrid, AWS SES, or Mailgun
- Implement email templates in separate files
- Add email queue for bulk operations
- Monitor email delivery rates
- Implement unsubscribe functionality