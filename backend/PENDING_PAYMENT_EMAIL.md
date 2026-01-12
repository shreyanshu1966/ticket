# Pending Payment Email Template - Usage Guide

## Overview
A catchy email template for sending payment reminders to users who haven't completed their registration payment. Features an **Early Bird Offer** theme with urgency elements.

## Features
✨ **Eye-catching Design**
- Vibrant gradient header with animated pulse effect
- Golden early bird badge with glow animation
- Countdown timer showing hours remaining
- Price comparison showing savings

🎯 **Conversion Optimized**
- Multiple call-to-action buttons
- Clear pricing breakdown with savings highlighted
- Benefit list showing what attendees get
- Urgency messaging throughout

⏰ **Dynamic Countdown**
- Automatically calculates time remaining (48 hours from registration)
- Shows hours remaining in large, bold numbers

💰 **Pricing Display**
- Shows original price (crossed out)
- Highlights early bird price
- Displays savings amount and percentage

## Usage

### 1. Import the function
```javascript
import { sendPendingPaymentEmail } from './services/emailService.js'
```

### 2. Send pending payment email
```javascript
// Example: Send to a specific registration
const registrationData = await Registration.findById(registrationId)

const result = await sendPendingPaymentEmail(registrationData)

if (result.success) {
  console.log('Email sent successfully:', result.messageId)
} else {
  console.error('Email failed:', result.error)
}
```

### 3. Bulk send to all pending payments
```javascript
// Example: Send to all registrations with pending payment
const pendingRegistrations = await Registration.find({
  paymentStatus: 'pending',
  ticketGenerated: false
})

for (const registration of pendingRegistrations) {
  const result = await sendPendingPaymentEmail(registration)
  console.log(`Email sent to ${registration.email}:`, result.success)
  
  // Add delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 1000))
}
```

### 4. Schedule automated reminders
```javascript
// Example: Using node-cron to send daily reminders
import cron from 'node-cron'

// Run every day at 10 AM
cron.schedule('0 10 * * *', async () => {
  console.log('Running pending payment reminder job...')
  
  const pendingRegistrations = await Registration.find({
    paymentStatus: 'pending',
    ticketGenerated: false,
    createdAt: { 
      $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Within last 48 hours
    }
  })
  
  for (const registration of pendingRegistrations) {
    await sendPendingPaymentEmail(registration)
  }
})
```

## Email Template Details

### Subject Line
```
⏰ Don't Miss Out! Early Bird Offer Ending Soon - ACD 2025
```

### Key Sections
1. **Header** - Vibrant gradient with animated background
2. **Early Bird Badge** - Golden badge with glow effect
3. **Urgency Box** - Yellow warning box with call to action
4. **Countdown Timer** - Large countdown showing hours remaining
5. **Price Comparison** - Shows regular vs early bird pricing
6. **CTA Buttons** - Two prominent call-to-action buttons
7. **Benefits List** - 6 key benefits with icons
8. **Event Details** - Date, time, venue information
9. **Registration Details** - User's registration information
10. **Important Notice** - Warning about limited availability
11. **Contact Information** - Support contact details

### Customization

You can customize the early bird offer duration by modifying the calculation in `emailService.js`:

```javascript
// Current: 48 hours
const offerEndTime = new Date(registrationTime.getTime() + (48 * 60 * 60 * 1000))

// Change to 24 hours:
const offerEndTime = new Date(registrationTime.getTime() + (24 * 60 * 60 * 1000))

// Change to 72 hours:
const offerEndTime = new Date(registrationTime.getTime() + (72 * 60 * 60 * 1000))
```

### Environment Variables Required

Make sure these are set in your `.env` file:
```env
EMAIL_FROM=noreply@acesmitadt.com
FRONTEND_URL=https://youreventsite.com
```

## Preview

Open `pending-payment-email-preview.html` in a browser to see how the email looks.

## Testing

Test the email before sending to users:

```javascript
// Test with sample data
const testData = {
  name: 'Test User',
  email: 'test@example.com',
  college: 'Test College',
  year: '3rd Year',
  amount: 19900, // ₹199 in paise
  _id: '677a1b2c3d4e5f6789012345',
  createdAt: new Date()
}

const result = await sendPendingPaymentEmail(testData)
console.log('Test email result:', result)
```

## Best Practices

1. **Timing** - Send reminders 24-48 hours after registration
2. **Frequency** - Don't spam - max 2-3 reminders total
3. **Segmentation** - Only send to truly pending payments
4. **A/B Testing** - Test different subject lines for better open rates
5. **Mobile Optimization** - Email is responsive and mobile-friendly
6. **Tracking** - Monitor open rates and click-through rates

## Notes

- Email includes both HTML and plain text versions
- Fully responsive design works on all devices
- Animations are CSS-based and email-client safe
- Uses inline styles for maximum compatibility
- Payment link includes registration ID for tracking
