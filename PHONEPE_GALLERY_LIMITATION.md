# PhonePe UPI Deep Link - Gallery Payment Limitation

## Problem
PhonePe restricts payments made via QR codes opened from the gallery to a maximum of ₹2,000. This is a security measure to prevent fraud. When users download a QR code and open it from their gallery, they see this error:

```
Error: You can pay up to ₹2,000 with QR codes via gallery. 
For more, pay with mobile number or scan QR codes.
```

## Root Cause
- **Gallery-based payments**: PhonePe treats QR codes opened from the gallery differently than those scanned live
- **Security measure**: This limitation prevents fraudulent QR codes from being shared and reused
- **Deep link limitation**: Generic `upi://pay` deep links may not work reliably across all UPI apps

## Solutions Implemented

### 1. App-Specific Deep Links
Instead of using the generic `upi://pay` scheme, we now support app-specific deep links:

- **PhonePe**: `phonepe://pay?pa=...`
- **Google Pay**: `tez://upi/pay?pa=...`
- **Paytm**: `paytmmp://pay?pa=...`
- **BHIM**: `bhim://pay?pa=...`

These app-specific links bypass the gallery limitation and open the payment directly in the respective app.

### 2. Multiple Payment Options (Mobile)
On mobile devices, users now see:
- Individual buttons for PhonePe, Google Pay, Paytm, and BHIM
- A prominent warning about the PhonePe gallery limitation
- Clear instructions to use the buttons instead of downloading QR codes

### 3. Clear Instructions (Desktop)
On desktop, users see:
- A warning NOT to download the QR code
- Instructions to scan the QR code directly using their phone's camera
- Emphasis on using the scan feature instead of gallery

## User Flow

### Mobile Users
1. User clicks on their preferred UPI app button (PhonePe, GPay, etc.)
2. The app-specific deep link opens the payment app directly
3. Payment details are pre-filled (UPI ID, amount, name)
4. User completes payment and returns to submit UTR

### Desktop Users
1. User sees the QR code on screen
2. User opens UPI app on their phone
3. User scans the QR code **directly** (not from gallery)
4. User completes payment and submits UTR on desktop

## Technical Details

### UPI Deep Link Format
```
upi://pay?pa=<UPI_ID>&pn=<PAYEE_NAME>&am=<AMOUNT>&cu=INR&tn=<TRANSACTION_NOTE>
```

### App-Specific Schemes
```javascript
// PhonePe
phonepe://pay?pa=iganarase@okicici&pn=Event%20Registration&am=199&cu=INR&tn=Registration%3A%20John

// Google Pay
tez://upi/pay?pa=iganarase@okicici&pn=Event%20Registration&am=199&cu=INR&tn=Registration%3A%20John

// Paytm
paytmmp://pay?pa=iganarase@okicici&pn=Event%20Registration&am=199&cu=INR&tn=Registration%3A%20John

// BHIM
bhim://pay?pa=iganarase@okicici&pn=Event%20Registration&am=199&cu=INR&tn=Registration%3A%20John
```

## Testing Recommendations

1. **Test on actual mobile devices** - Emulators may not have UPI apps installed
2. **Test with multiple UPI apps** - Different apps may handle deep links differently
3. **Test both flows**:
   - Mobile: Click app-specific buttons
   - Desktop: Scan QR code with phone

## Alternative Solutions (Not Implemented)

### 1. UPI Intent (Android Only)
```
intent://pay?pa=...#Intent;scheme=upi;package=com.phonepe.app;end
```
This works only on Android and requires knowing the package name of each app.

### 2. Payment Gateway Integration
Use Razorpay, PayU, or similar payment gateways that handle UPI payments. This adds transaction fees but provides better reliability.

### 3. Manual UPI ID Entry
Allow users to manually copy the UPI ID and make payment in their app. This is the fallback option already available.

## References
- [UPI Deep Linking Specification](https://www.npci.org.in/what-we-do/upi/upi-specifications)
- [PhonePe Developer Documentation](https://developer.phonepe.com/)
- [Google Pay Developer Documentation](https://developers.google.com/pay/india)

## Support
If users still face issues:
1. Ask them to manually enter the UPI ID in their app
2. Ensure they're using the latest version of their UPI app
3. Try a different UPI app
4. Contact PhonePe support if the issue persists
