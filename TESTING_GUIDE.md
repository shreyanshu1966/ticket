# Testing Guide - UPI Payment System

## ✅ Database Fixed
The MongoDB index issue has been resolved. You can now create multiple registrations.

## 🔧 Configuration Updated
- **UPI ID**: `iganarase@okicici` (matches QR code)
- **Amount**: ₹199
- **QR Code**: Available at `/public/upi_qr.jpeg`

## 🧪 Testing Steps

### 1. Test Registration Flow

#### On Desktop:
1. Open http://localhost:5173 (or your frontend URL)
2. Fill out the registration form
3. Click "Continue to Payment"
4. **You should see**: QR code displayed prominently
5. Scan QR code with your phone's UPI app
6. Complete payment
7. Click "I have completed the payment"
8. Enter UTR number and upload screenshot
9. Submit

#### On Mobile:
1. Open http://localhost:5173 on your phone
2. Fill out the registration form
3. Click "Continue to Payment"
4. **You should see**: "Pay with UPI App" button
5. Click the button - UPI app should open
6. Complete payment
7. Return to browser
8. Click "I have completed the payment"
9. Enter UTR number and upload screenshot
10. Submit

### 2. Test Admin Verification

1. Go to http://localhost:5173/admin/login
2. Login with admin credentials
3. Navigate to "Manage Registrations"
4. Filter by "Awaiting Verification"
5. Click "Verify Payment" on a registration
6. **Verify you can see**:
   - User details
   - Payment screenshot (full size)
   - UTR number
   - Payment amount
7. Click "Approve & Send Ticket"
8. Check user's email for ticket

### 3. Verify Payment Status Changes

Check that statuses update correctly:
- `pending` → After registration
- `paid_awaiting_verification` → After UTR submission
- `verified` → After admin approval (brief)
- `completed` → After ticket email sent

## 🎯 What to Look For

### ✅ Success Indicators:
- [ ] Desktop shows QR code
- [ ] Mobile shows UPI deep link button
- [ ] UPI app opens on mobile when button clicked
- [ ] QR code can be scanned successfully
- [ ] UTR and screenshot can be submitted
- [ ] Admin can view payment screenshot
- [ ] Admin can approve/reject payments
- [ ] Ticket email is sent on approval
- [ ] No database errors in console

### ❌ Common Issues:

**Issue**: UPI app doesn't open on mobile
- **Fix**: Check if UPI ID is correct in `src/config.js`
- **Fix**: Ensure user has a UPI app installed

**Issue**: QR code not showing
- **Fix**: Verify `/public/upi_qr.jpeg` exists
- **Fix**: Check browser console for errors

**Issue**: Screenshot not displaying in admin
- **Fix**: Check if screenshot was uploaded correctly
- **Fix**: Verify base64 encoding is working

**Issue**: Database duplicate key error
- **Fix**: Already fixed! Run `node backend/fix_ticket_index.js` if it happens again

## 📱 Device Detection Test

To verify device detection is working:

1. **Desktop Browser**:
   - Open DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Select a mobile device
   - Refresh page
   - Should now show UPI button instead of QR

2. **Actual Mobile Device**:
   - Access from phone
   - Should show UPI button
   - Button should open UPI app

## 🔍 Backend Logs to Monitor

Watch for these in backend console:
```
✅ Registration created (pending payment): [ID]
✅ Payment details submitted for verification: [ID]
✅ Payment verified and ticket sent successfully
✅ Ticket email sent successfully
```

## 📧 Email Testing

After admin approval, check:
- [ ] Email received in user's inbox
- [ ] Ticket number is visible
- [ ] QR code is displayed
- [ ] All user details are correct

## 🎨 UI/UX Verification

### Desktop Payment Page:
- [ ] QR code is centered and large (256x256px)
- [ ] White background around QR code
- [ ] Clear instructions: "Scan QR Code to Pay"
- [ ] "I have completed payment" button below QR

### Mobile Payment Page:
- [ ] Large "Pay with UPI App" button with icon
- [ ] Button has gradient (purple to blue)
- [ ] "OR" divider
- [ ] "I have completed payment" button

### Verification Form:
- [ ] UTR input field with placeholder
- [ ] File upload for screenshot
- [ ] Preview of uploaded screenshot
- [ ] Clear error messages
- [ ] Submit button disabled until both filled

### Admin Modal:
- [ ] Full-width screenshot display
- [ ] All payment details visible
- [ ] Notes textarea
- [ ] Rejection reason textarea
- [ ] Approve (green) and Reject (red) buttons

## 🚀 Quick Start Commands

```bash
# Start backend
cd backend
npm run dev

# Start frontend (in new terminal)
cd ..
npm run dev

# Fix database index (if needed)
cd backend
node fix_ticket_index.js
```

## 📊 Test Data

Use these for testing:

**Test Registration**:
- Name: Test User
- Email: test@example.com
- Phone: 9876543210
- College: Test College
- Year: 3rd Year

**Test UTR**: 123456789012 (12 digits)

**Test Screenshot**: Any payment screenshot image

## ✨ Success Criteria

All tests pass when:
1. ✅ Registration creates successfully
2. ✅ Correct payment UI shows based on device
3. ✅ UPI deep link/QR code works
4. ✅ UTR and screenshot submission works
5. ✅ Admin can view and verify payments
6. ✅ Ticket email is sent on approval
7. ✅ No console errors
8. ✅ Database updates correctly

## 🎉 Ready to Go!

Your UPI payment system is now fully configured and ready for testing!

**Next Steps**:
1. Test on desktop browser
2. Test on mobile device
3. Test admin verification
4. Verify email delivery
5. Deploy to production when satisfied
