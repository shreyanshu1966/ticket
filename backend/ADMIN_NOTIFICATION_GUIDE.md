# Admin Notification System - Behavior Guide

## Overview
The admin notification system now has **intelligent template selection** based on the target group.

---

## Target Groups & Templates

### 1. 🔴 Pending Payments
**Target Group:** `pending`  
**Template Used:** **Designed Pending Payment Template** (Automatic)  
**From:** `noreply@acesmitadt.com`

#### What Happens:
When you select "Pending Payments" as the target group and send a notification:
- ✅ **Ignores** the custom subject and message you enter in the admin panel
- ✅ **Automatically uses** the designed pending payment template
- ✅ **Includes:**
  - ⏰ Countdown timer showing **48 hours** (hardcoded)
  - 💰 Early bird pricing comparison
  - ⚡ Urgency indicators
  - 🎯 Payment CTA button
  - 📋 Complete registration details
  - 📅 Event information
  - 📞 Support contacts

#### Subject (Auto-generated):
```
⏰ Complete Your Registration - Early Bird Offer Active | ACD 2026
```

#### Why?
The designed template is specifically crafted to maximize conversion for pending payments with psychological triggers (countdown, savings, urgency). It's much more effective than a basic text notification.

---

### 2. ✅ Completed Payments
**Target Group:** `completed`  
**Template Used:** Basic Notification Template  
**From:** `noreply@acesmitadt.com`

#### What Happens:
- ✅ Uses your custom subject and message
- ✅ Basic professional template with ACD 2026 branding
- ✅ Supports `{name}` placeholder for personalization

#### Example Use Cases:
- Event reminders
- Venue updates
- Schedule changes
- Important announcements

---

### 3. ❌ Failed Payments
**Target Group:** `failed`  
**Template Used:** Basic Notification Template  
**From:** `noreply@acesmitadt.com`

#### What Happens:
- ✅ Uses your custom subject and message
- ✅ Basic professional template
- ✅ Supports `{name}` placeholder

---

### 4. 📢 All Registered Users
**Target Group:** `all`  
**Template Used:** Basic Notification Template  
**From:** `noreply@acesmitadt.com`

#### What Happens:
- ✅ Uses your custom subject and message
- ✅ Sends to everyone regardless of payment status
- ✅ Supports `{name}` placeholder

---

## Admin Panel Behavior

### When Sending to "Pending Payments":

**What You See in Admin Panel:**
```
Target Group: Pending Payments
Subject: Payment Pending - Complete Your Registration
Message: Hi {name}, We noticed that your payment...
```

**What Actually Gets Sent:**
```
Subject: ⏰ Complete Your Registration - Early Bird Offer Active | ACD 2026
Template: Designed Pending Payment Template
  - Countdown Timer: "48 hours remaining"
  - Early Bird Price: ₹199
  - Regular Price: ₹299 (crossed out)
  - Savings: Save ₹100
  - Payment Button
  - Full registration details
  - Event information
```

**Response Message:**
```
✅ Pending payment notifications sent! X emails sent
Template Used: Designed Pending Payment Template (with countdown timer & early bird offer)
```

---

### When Sending to Other Groups:

**What You See:**
```
Target Group: Completed Payments
Subject: Event Reminder - ACD 2026
Message: Hi {name}, This is a reminder about...
```

**What Gets Sent:**
```
Subject: Event Reminder - ACD 2026
Message: Hi [Name], This is a reminder about...
Template: Basic notification with ACD 2026 branding
```

---

## Quick Templates

### Template 1: Event Reminder (For Completed Payments)
```
Subject: Event Reminder - ACD 2026
Target: Completed Payments
Message:
Hi {name},

This is a reminder that ACD 2026 is coming up soon!

Event Details:
📅 Date: January 28-29, 2026
⏰ Time: 8:00 PM - 5:00 PM
📍 Venue: Urmilatai Karad Auditorium, MIT ADT Pune

Please bring your e-ticket and a valid ID.

See you there!
ACD 2026 Team
```

### Template 2: Pending Payment (For Pending Payments)
```
Target: Pending Payments
Note: Subject and message will be ignored.
The designed template with countdown timer will be used automatically.
```

### Template 3: Important Update (For All Users)
```
Subject: Important Update - ACD 2026 Event
Target: All Registered Users
Message:
Hi {name},

We have an important update regarding ACD 2026:

[Your update message here]

If you have any questions, please contact:
Aayush: 9226750350
Ishan: 9552448038

Best regards,
ACD 2026 Team
```

---

## Technical Details

### Email Sending Flow

```
Admin Sends Notification
       ↓
Check Target Group
       ↓
┌──────────────────────────────────┐
│  Is target = "pending"?          │
└──────────────────────────────────┘
       ↓                    ↓
      YES                  NO
       ↓                    ↓
Use Designed          Use Basic
Template              Template
       ↓                    ↓
Send via              Send via
noreplyTransporter    noreplyTransporter
       ↓                    ↓
Return success        Return success
with template info    with custom info
```

### Rate Limiting
- **Batch Size:** 10 emails per batch
- **Delay Between Emails:** 1 second (for pending payments)
- **Delay Between Batches:** 1 second (for bulk notifications)

### Retry Logic
- **Max Retries:** 3 attempts
- **Backoff:** Exponential (1s, 2s, 4s)
- **Max Wait:** 5 seconds

---

## Best Practices

### ✅ DO:
- Use "Pending Payments" target for payment reminders
- Use "Completed Payments" for event updates
- Use `{name}` placeholder for personalization
- Keep messages concise and clear
- Test with a small group first

### ❌ DON'T:
- Don't try to customize pending payment template via admin panel
- Don't send too many notifications (respect user inbox)
- Don't use all caps in subject lines
- Don't forget to use {name} placeholder

---

## Monitoring

### Success Response
```json
{
  "success": true,
  "message": "Pending payment notifications sent! 15 emails sent",
  "data": {
    "sent": 15,
    "failed": 0,
    "total": 15,
    "targetGroup": "pending",
    "templateUsed": "Designed Pending Payment Template (with countdown timer & early bird offer)",
    "subject": "⏰ Complete Your Registration - Early Bird Offer Active | ACD 2026"
  }
}
```

### Check Server Logs
Look for:
```
📧 Sending designed pending payment emails to X recipients...
✅ Pending payment email sent to user@example.com
✅ Pending payment email sent: messageId
```

---

## Support

For issues with the notification system:
- **Aayush:** 9226750350
- **Ishan:** 9552448038
- **Email:** mail@acesmitadt.com
