# New Event Timing Update Guide

## Overview

This guide explains how to send timing update emails to users for the **Day 1 timing change** from 8:00 AM - 5:00 PM to **10:00 AM - 6:00 PM**.

## What's Updated

**Day 1 Timing Change:**
- **Previous**: 8:00 AM - 5:00 PM
- **New**: 10:00 AM - 6:00 PM
- **Date**: January 28, 2026 (Day 1)

**Day 2 Timing (Unchanged):**
- **Time**: 8:00 AM - 5:00 PM  
- **Date**: January 29, 2026 (Day 2)

## Sending New Timing Update Emails

### Via Admin Dashboard

1. **Navigate**: Go to Admin Dashboard → Notifications
2. **Find Section**: Look for "New Event Timing Update" (green section with clock icon)
3. **Choose Target Group**:
   - **Send to All Users**: Notify all registered users
   - **Completed Only**: Only users with completed payments
   - **Pending Only**: Only users with pending payments
4. **Click Send Button**
5. **Confirm**: Click "OK" in the confirmation dialog

### API Endpoint

**POST** `/api/admin/notifications/new-timing-update`

### Authentication

Requires admin authentication token in the Authorization header:
```
Authorization: Bearer <admin_token>
```

### Request Body

```json
{
  "targetGroup": "all"
}
```

### Target Groups

- `"all"` - Send to all registered users (completed + pending + awaiting verification)
- `"completed"` - Send only to users with completed payments
- `"pending"` - Send only to users with pending payments

### Example Request

```bash
curl -X POST http://localhost:5000/api/admin/notifications/new-timing-update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"targetGroup": "all"}'
```

### Using Postman

1. **Method**: POST
2. **URL**: `http://localhost:5000/api/admin/notifications/new-timing-update`
3. **Headers**:
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer YOUR_ADMIN_TOKEN`
4. **Body** (raw JSON):
   ```json
   {
     "targetGroup": "all"
   }
   ```

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "New timing update emails sent! 25 emails sent",
  "data": {
    "sent": 25,
    "failed": 0,
    "total": 25,
    "targetGroup": "all",
    "subject": "⏰ Important Update: New Event Timing for Day 1 - ACD 2026",
    "errors": []
  }
}
```

### Partial Success (Some Failed)

```json
{
  "success": true,
  "message": "New timing update emails sent! 23 emails sent, 2 failed",
  "data": {
    "sent": 23,
    "failed": 2,
    "total": 25,
    "targetGroup": "all",
    "subject": "⏰ Important Update: New Event Timing for Day 1 - ACD 2026",
    "errors": [
      {
        "email": "user@example.com",
        "error": "Email delivery failed"
      }
    ]
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error sending new timing update emails: Database connection failed"
}
```

## Important Notes

1. **Email Rate Limiting**: There's a 1-second delay between each email to avoid rate limiting
2. **Email Queue**: Uses the noreply email service with queuing for reliability
3. **Error Handling**: Failed emails are logged and reported in the response
4. **Authentication Required**: Must be logged in as admin to send notifications
5. **Target Group Validation**: Only 'all', 'completed', and 'pending' are allowed

## Recommended Steps

1. **Test First**: Send to a small test group or single user initially
2. **Check Logs**: Monitor server logs for any email sending issues
3. **Verify Content**: Use the preview file (`new-timing-update-preview.html`) to check email appearance
4. **Send Gradually**: Consider sending to different groups separately

## Console Output

When sending emails, you'll see console output like:
```
📧 Sending new timing update emails to 25 recipients...
📧 Sending new timing update email...
✅ New timing update email sent: 1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p
✅ New timing update email sent to user1@example.com
✅ New timing update email sent to user2@example.com
...
```

## Email Template Features

The timing update email includes:

### Header
- **Green gradient design** with clock icon
- **"Timing Update"** title with "New Schedule for Day 1" subtitle

### Content Highlights
- **Clear announcement** of the Day 1 timing change
- **Large highlighted box** showing new timing: 10:00 AM - 6:00 PM
- **Complete schedule** for both days in a table format
- **Important notes** about planning travel and event logistics

### Professional Elements
- Personalized greeting with user's name
- Complete event details and venue information
- Contact information for support
- Professional closing from ACES Event Organization Team

## Troubleshooting

### Common Issues

1. **Authentication Error (401/403)**
   - Check admin token validity
   - Re-login to admin dashboard

2. **No Recipients Found**
   - Verify target group has registered users
   - Check database connection

3. **Email Sending Failures**
   - Check email service configuration
   - Verify SMTP settings
   - Monitor rate limiting

### Logs to Check

- Server console output for email sending status
- Email service logs for SMTP issues
- Database logs for query problems

## Preview

A preview of the email template is available in `new-timing-update-preview.html`. Open this file in a browser to see how the email will appear to recipients.

## Support

For technical issues or questions about the timing update system:

- **Technical Contact**: Check server logs and email configuration
- **Content Questions**: Verify the email template content in the preview
- **User Support**: 
  - Aayush: 9226750350
  - Ishan: 9552448038
  - Email: mail@acesmitadt.com