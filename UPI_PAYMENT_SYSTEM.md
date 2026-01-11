# UPI Payment System - Complete Implementation Summary

## Overview
The ticket registration system now uses **UPI deep links** for payment with manual verification by admin. Razorpay has been completely removed.

## Payment Flow

### 1. User Registration
1. User fills out the registration form (name, email, phone, college, year)
2. Form is validated and submitted to `/api/registrations/create`
3. Backend creates a registration with `paymentStatus: 'pending'`
4. User is redirected to the payment page

### 2. Payment Process

#### For Mobile Users:
- **Multiple UPI App Buttons** are displayed (PhonePe, Google Pay, Paytm, BHIM)
- App-specific deep links for better compatibility:
  - PhonePe: `phonepe://pay?pa=...`
  - Google Pay: `tez://upi/pay?pa=...`
  - Paytm: `paytmmp://pay?pa=...`
  - BHIM: `bhim://pay?pa=...`
  - Generic: `upi://pay?pa=...` (for other apps)
- When clicked, it opens the selected UPI app directly with pre-filled payment details
- **⚠️ PhonePe Gallery Limitation**: Users are warned NOT to download QR codes and open from gallery (₹2,000 limit)
- User completes payment in their UPI app

#### For Desktop Users:
- **QR Code** is displayed (from `/public/upi_qr.jpeg`)
- **⚠️ Important Warning**: Users must scan QR code directly, NOT download and open from gallery
- User scans the QR code with their phone's UPI app camera
- User completes payment in their UPI app

### 3. Payment Verification Submission
After completing payment, users must:
1. Click "I have completed the payment"
2. Enter the **UTR (UPI Transaction Reference) number** from their payment confirmation
3. Upload a **screenshot** of the payment confirmation
4. Submit for admin verification

The system:
- Converts screenshot to base64
- Sends to `/api/registrations/submit-payment`
- Updates registration status to `paid_awaiting_verification`
- Stores UTR number and screenshot

### 4. Admin Verification

#### Admin Dashboard Features:
- View all registrations with filters (status, year, search)
- See payment details including:
  - UTR number
  - Payment screenshot
  - Submission timestamp
  - User details

#### Verification Process:
1. Admin clicks "Verify Payment" on registrations with status `paid_awaiting_verification`
2. Modal opens showing:
   - Full registration details
   - Payment screenshot (full size, zoomable)
   - UTR number
   - Payment method and amount
3. Admin can:
   - **Approve**: Changes status to `verified`, then `completed`, sends ticket email
   - **Reject**: Changes status to `failed`, requires rejection reason

### 5. Ticket Generation
When admin approves payment:
1. Status changes to `verified`
2. Email service generates:
   - Unique ticket number
   - QR code for entry verification
3. Ticket email is sent to user
4. Status updates to `completed`
5. Registration is marked with `ticketGenerated: true`

## Database Schema

### Registration Model Fields:
```javascript
{
  // User Details
  name: String (required)
  email: String (required, unique)
  phone: String (required)
  college: String (required)
  year: String (required, enum)
  
  // Payment Details
  paymentStatus: String (enum: pending, paid_awaiting_verification, verified, completed, failed)
  paymentMethod: String (default: 'upi')
  upiTransactionId: String (UTR number)
  paymentScreenshot: String (base64 image)
  paymentSubmittedAt: Date
  amount: Number (default: 19900 paise = ₹199)
  
  // Admin Verification
  adminVerifiedAt: Date
  adminVerifiedBy: String
  paymentNotes: String
  paymentRejectionReason: String
  
  // Ticket Details
  ticketNumber: String (unique, sparse)
  qrCode: String
  ticketGenerated: Boolean
  emailSentAt: Date
  
  // Entry Verification
  isScanned: Boolean
  scannedAt: Date
  entryConfirmed: Boolean
}
```

## Payment Status Flow

```
pending 
  ↓ (user submits UTR + screenshot)
paid_awaiting_verification
  ↓ (admin approves)
verified
  ↓ (ticket email sent)
completed

OR

paid_awaiting_verification
  ↓ (admin rejects)
failed
```

## Configuration

### Frontend (`src/config.js`):
```javascript
export const PAYMENT_CONFIG = {
  UPI_ID: 'example@paytm',  // UPDATE THIS with your actual UPI ID
  AMOUNT: 199,              // Amount in rupees
  EVENT_NAME: 'Event Registration'
}
```

### QR Code:
- Location: `/public/upi_qr.jpeg`
- **ACTION REQUIRED**: Replace this with your actual UPI QR code
- Generate from any UPI app (Google Pay, PhonePe, Paytm, etc.)

## API Endpoints

### Registration Endpoints:
- `POST /api/registrations/create` - Create new registration
- `POST /api/registrations/submit-payment` - Submit payment details
- `PATCH /api/registrations/:id/verify` - Admin verify payment
- `PATCH /api/registrations/:id/payment-status` - Update payment status

### Admin Endpoints:
- `GET /api/admin/registrations` - Get all registrations (with filters)
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `DELETE /api/admin/registrations/:id` - Delete registration
- `POST /api/admin/notifications/bulk` - Send bulk notifications

## Key Features

### Device Detection:
- Automatically detects if user is on mobile or desktop
- Shows appropriate payment method (deep link vs QR code)
- Uses regex: `/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i`

### Security:
- Screenshot stored as base64 in database
- Admin authentication required for verification
- JWT tokens for admin sessions
- CORS enabled for API security

### User Experience:
- Clear instructions at each step
- Visual feedback for payment status
- Error handling with user-friendly messages
- Responsive design for all devices

## Database Fix Applied

Fixed the `ticketNumber` index issue:
- Dropped old non-sparse unique index
- Created new sparse unique index
- Now allows multiple registrations with `null` ticketNumber
- Ticket number only assigned after admin approval

## Files Modified

### Frontend:
- `src/PaymentForm.jsx` - Added device detection and QR code display
- `src/config.js` - UPI payment configuration

### Backend:
- `backend/controllers/registrationController.js` - Payment submission and verification
- `backend/controllers/adminController.js` - Admin dashboard and verification
- `backend/models/Registration.js` - Database schema with payment fields

### Admin Interface:
- `src/AdminRegistrations.jsx` - Registration management
- `src/PaymentVerificationModal.jsx` - Payment verification UI

## Setup Instructions

1. **Update UPI Configuration**:
   ```javascript
   // In src/config.js
   UPI_ID: 'your-upi-id@bank'  // Replace with your actual UPI ID
   ```

2. **Replace QR Code**:
   - Generate your UPI QR code from any UPI app
   - Save as `/public/upi_qr.jpeg`
   - Recommended size: 512x512 or larger

3. **Database**:
   - Index has been fixed automatically
   - No manual intervention needed

4. **Testing**:
   - Test on both mobile and desktop
   - Verify QR code works correctly
   - Test admin verification flow

## Admin Workflow

1. Login to admin dashboard
2. Navigate to "Manage Registrations"
3. Filter by status: "Awaiting Verification"
4. Click "Verify Payment" on pending registrations
5. Review:
   - User details
   - Payment screenshot
   - UTR number
6. Approve or Reject with notes
7. System automatically sends ticket email on approval

## User Workflow

1. Fill registration form
2. Submit and proceed to payment
3. **Mobile**: Click "Pay with UPI App" → Opens UPI app
4. **Desktop**: Scan QR code with phone → Opens UPI app
5. Complete payment in UPI app
6. Return to website
7. Click "I have completed the payment"
8. Enter UTR number and upload screenshot
9. Submit for verification
10. Wait for admin approval
11. Receive ticket via email

## Important Notes

- ✅ Razorpay completely removed
- ✅ UPI deep links working for mobile
- ✅ QR code display for desktop
- ✅ Manual verification by admin
- ✅ Screenshot and UTR collection
- ✅ Automatic ticket generation on approval
- ⚠️ **UPDATE**: Replace UPI ID in config
- ⚠️ **UPDATE**: Replace QR code in public folder

## Support & Troubleshooting

### Common Issues:

1. **UPI app not opening on mobile**:
   - Check if UPI ID is correct in config
   - Ensure user has UPI app installed
   - Try using app-specific buttons instead of generic UPI link

2. **PhonePe "₹2,000 gallery limit" error**:
   - User downloaded QR code and opened from gallery
   - Solution: Use the app-specific buttons on mobile
   - Or scan QR code directly with camera (don't download)
   - See `PHONEPE_GALLERY_LIMITATION.md` for details

3. **QR code not displaying**:
   - Verify `/public/upi_qr.jpeg` exists
   - Check file permissions

4. **Database errors**:
   - Run `node fix_ticket_index.js` if needed
   - Check MongoDB connection

5. **Email not sending**:
   - Verify email configuration in backend `.env`
   - Check email service credentials
