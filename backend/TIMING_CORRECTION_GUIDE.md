# Timing Correction Email Guide

## Overview

This guide explains how to send timing correction emails to users who received emails with incorrect event timing (8:00 PM instead of 8:00 AM).

## What Was Fixed

All email templates have been corrected from:
- ❌ **Incorrect**: 8:00 PM - 5:00 PM
- ✅ **Correct**: 8:00 AM - 5:00 PM

## Sending Correction Emails

### API Endpoint

**POST** `/api/admin/notifications/timing-correction`

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
curl -X POST http://localhost:5000/api/admin/notifications/timing-correction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"targetGroup": "all"}'
```

### Using Postman

1. **Method**: POST
2. **URL**: `http://localhost:5000/api/admin/notifications/timing-correction`
3. **Headers**:
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer YOUR_ADMIN_TOKEN`
4. **Body** (raw JSON):
   ```json
   {
     "targetGroup": "all"
   }
   ```

## Email Template

The correction email includes:

### Features
- ⚠️ Clear warning icon and "Important Update" header
- Side-by-side comparison of incorrect vs correct timing
- Full event details with corrected timing highlighted
- Professional apology message
- Contact information for support

### Subject Line
```
⚠️ Important Update: Event Timing Correction - ACD 2026
```

### Content Highlights
- **Incorrect Timing** (crossed out): 8:00 PM - 5:00 PM
- **✓ Correct Timing** (highlighted): 8:00 AM - 5:00 PM
- Confirmed event details
- Apology for the inconvenience

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Timing correction emails sent! 25 emails sent",
  "data": {
    "sent": 25,
    "failed": 0,
    "total": 25,
    "targetGroup": "all",
    "subject": "⚠️ Important Update: Event Timing Correction - ACD 2026",
    "errors": []
  }
}
```

### Partial Success (Some Failed)

```json
{
  "success": true,
  "message": "Timing correction emails sent! 23 emails sent, 2 failed",
  "data": {
    "sent": 23,
    "failed": 2,
    "total": 25,
    "targetGroup": "all",
    "subject": "⚠️ Important Update: Event Timing Correction - ACD 2026",
    "errors": [
      {
        "email": "user@example.com",
        "error": "Email delivery failed"
      }
    ]
  }
}
```

## Important Notes

1. **Rate Limiting**: The system automatically adds a 1-second delay between each email to avoid rate limiting
2. **Email Service**: Uses the noreply email configuration
3. **Logging**: All email sends are logged in the console for tracking
4. **Error Handling**: Failed emails are tracked and returned in the response

## Recommended Steps

1. **Test First**: Send to a small group or test email first
2. **Check Logs**: Monitor the backend console for real-time sending status
3. **Verify**: Check that emails are being received correctly
4. **Send to All**: Once verified, send to all registered users

## Console Output

When sending, you'll see logs like:
```
📧 Sending timing correction emails to 25 recipients...
📧 Sending timing correction email...
✅ Timing correction email sent: <messageId>
✅ Timing correction email sent to user1@example.com
✅ Timing correction email sent to user2@example.com
...
```

## Troubleshooting

### No Recipients Found
- Check that users exist in the database
- Verify the targetGroup parameter is correct

### Email Sending Fails
- Check email service configuration in `.env`
- Verify SMTP credentials are correct
- Check email service rate limits

### Some Emails Fail
- Review the `errors` array in the response
- Check individual email addresses for validity
- Retry failed emails if needed

## Email Preview

The email will look like this:

```
┌─────────────────────────────────────┐
│ ⚠️ Important Update                 │
│ Event Timing Correction             │
├─────────────────────────────────────┤
│                                     │
│ Dear [Name],                        │
│                                     │
│ We're writing to inform you of an  │
│ important correction regarding the  │
│ event timing for ACD 2026.          │
│                                     │
│ ⏰ Timing Correction                │
│ Our previous email contained an     │
│ error in the event timing.          │
│                                     │
│ ┌─────────────┬─────────────┐      │
│ │ Incorrect   │ ✓ Correct   │      │
│ │ (Previous)  │ Timing      │      │
│ ├─────────────┼─────────────┤      │
│ │ 8:00 PM -   │ 8:00 AM -   │      │
│ │ 5:00 PM     │ 5:00 PM     │      │
│ └─────────────┴─────────────┘      │
│                                     │
│ 📅 Confirmed Event Details          │
│ Event: ACD 2026 - ACES Community Day│
│ Dates: January 28-29, 2026          │
│ Time: 8:00 AM - 5:00 PM            │
│ Venue: Urmila Tai Karad Auditorium   │
│                                     │
│ We sincerely apologize for any      │
│ inconvenience this may have caused. │
│                                     │
└─────────────────────────────────────┘
```

## Support

For any issues or questions:
- **Aayush**: 9226750350
- **Ishan**: 9552448038
- **Email**: mail@acesmitadt.com
