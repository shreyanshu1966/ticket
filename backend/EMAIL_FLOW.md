# Email Flow Summary

## Email Senders Configuration

### 🎫 Main Email (Transactional)
**Email:** `your-main-email@acesmitadt.com`  
**Port:** 587 (STARTTLS)  
**Used For:**
- ✅ Registration confirmation emails
- ✅ E-Ticket emails with QR codes
- ✅ Test emails

**Why Main Email?**
These are critical transactional emails that users expect to receive from the official event email. They contain important information like tickets and confirmations.

---

### 📧 Noreply Email (Notifications)
**Email:** `noreply@acesmitadt.com`  
**Port:** 587 (STARTTLS)  
**Used For:**
- 📧 **Pending payment reminder emails** (with designed template featuring countdown timer and early bird offer)
- 📢 Bulk notification emails
- 📢 Mass announcements
- 📢 Automated system notifications

**Why Noreply Email?**
These are automated notifications and reminders that don't require replies. Using a noreply address helps users understand these are automated messages and reduces inbox clutter on the main email.

---

## Email Templates

### 1. Registration Confirmation Email
- **Sender:** Main Email
- **Template:** Professional confirmation with event details
- **Sent:** Immediately after payment verification
- **Contains:** Registration details, event information, contact info

### 2. E-Ticket Email
- **Sender:** Main Email
- **Template:** Ticket with QR code
- **Sent:** Shortly after registration confirmation
- **Contains:** QR code, ticket number, event details, venue information
- **Attachments:** QR code PNG, ACES logo

### 3. Pending Payment Reminder Email ⭐
- **Sender:** Noreply Email
- **Template:** Premium designed template with:
  - ⏰ Countdown timer showing **48 hours** (hardcoded for consistency)
  - 💰 Early bird pricing comparison
  - ⚡ Urgency indicators
  - 📋 Registration details
  - 🎯 Clear CTA button
  - 📞 Support contact information
- **Sent:** For incomplete registrations
- **Purpose:** Encourage payment completion with early bird offer
- **Note:** Timer always shows 48 hours regardless of when registration was created

### 4. Bulk Notification Email
- **Sender:** Noreply Email
- **Template:** Basic notification template
- **Sent:** For mass announcements
- **Contains:** Custom message with personalization

---

## Configuration Summary

```env
# Main Email (Transactional)
EMAIL_HOST=mail.acesmitadt.com
EMAIL_PORT=587
EMAIL_USER=your-main-email@acesmitadt.com
EMAIL_PASSWORD=your-main-password
EMAIL_FROM=your-main-email@acesmitadt.com

# Noreply Email (Notifications)
NOREPLY_EMAIL_HOST=mail.acesmitadt.com
NOREPLY_EMAIL_PORT=587
NOREPLY_EMAIL_USER=noreply@acesmitadt.com
NOREPLY_EMAIL_PASSWORD=your-noreply-password
```

---

## Email Flow Diagram

```
User Registration
       ↓
   Payment Made
       ↓
   ┌─────────────────────────────┐
   │  Registration Confirmation  │ ← Main Email
   │  (Immediate)                │
   └─────────────────────────────┘
       ↓
   ┌─────────────────────────────┐
   │  E-Ticket with QR Code      │ ← Main Email
   │  (1 second delay)           │
   └─────────────────────────────┘


User Registration (No Payment)
       ↓
   ┌─────────────────────────────┐
   │  Pending Payment Reminder   │ ← Noreply Email
   │  (Designed Template)        │
   │  - Countdown Timer          │
   │  - Early Bird Offer         │
   │  - Payment Link             │
   └─────────────────────────────┘


Admin Notification to "Pending Payments" Group
       ↓
   ┌─────────────────────────────┐
   │  Pending Payment Reminder   │ ← Noreply Email
   │  (Designed Template)        │ ⚠️ IGNORES custom subject/message
   │  - Countdown Timer          │    from admin panel
   │  - Early Bird Offer         │
   │  - Payment Link             │
   └─────────────────────────────┘


Admin Notification to Other Groups
       ↓
   ┌─────────────────────────────┐
   │  Custom Notification        │ ← Noreply Email
   │  (Basic Template)           │ ✅ USES custom subject/message
   │  - Admin's subject          │    from admin panel
   │  - Admin's message          │
   └─────────────────────────────┘
```

---

## Key Features

### Pending Payment Email (Designed Template)
✅ **Professional Dark Theme Design**
- Gradient backgrounds
- Modern color scheme
- Responsive layout

✅ **Urgency Elements**
- Real-time countdown timer
- Early bird pricing comparison
- Limited time offer messaging

✅ **Clear Call-to-Action**
- Prominent payment button
- Direct payment link
- Secure UPI payment indicator

✅ **Complete Information**
- Registration details
- Event information
- Support contact details

---

## Testing

### Test Pending Payment Email
1. Create a registration without payment
2. Trigger pending payment reminder
3. Check that email comes from `noreply@acesmitadt.com`
4. Verify the designed template with countdown timer is used
5. Confirm early bird offer details are displayed

### Test Registration Flow
1. Complete a registration with payment
2. Verify confirmation email from main email
3. Verify ticket email from main email
4. Check both emails arrive within seconds

---

## Support

For email configuration or template issues:
- **Aayush:** 9226750350
- **Ishan:** 9552448038
- **Email:** mail@acesmitadt.com
