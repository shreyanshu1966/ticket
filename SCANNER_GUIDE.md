# 📱 QR Scanner System - Complete Guide

## Overview
The QR scanner is used at the event entrance to verify tickets and confirm attendee entry. It scans the QR code on tickets and validates them against the database.

## 🔄 Complete Flow

```
Event Staff Opens Scanner → Authenticates → Scans QR Code → Verifies Ticket → Confirms Entry
```

## 📋 Detailed Step-by-Step Process

### 1. **Authentication** 🔐
**File**: `src/ScannerAuth.jsx`

- Scanner requires authentication before use
- Default credentials stored in localStorage
- Prevents unauthorized access to scanner

```javascript
// Default credentials
Username: "scanner"
Password: "scanner123"
```

**What happens:**
1. Staff opens `/scanner` route
2. If not authenticated, shows login screen
3. Enter credentials
4. On success, stores `scannerAuth: 'authenticated'` in localStorage
5. Scanner interface loads

---

### 2. **Camera Initialization** 📷
**File**: `src/QRScanner.jsx` (Lines 40-69)

**Features:**
- Auto-detects camera capabilities (flash, zoom, focus)
- Uses back camera by default (environment facing)
- Continuous auto-focus for sharp QR codes
- Real-time scanning

```javascript
Camera Capabilities Detected:
✓ Flash/Torch - Toggle flashlight for low light
✓ Zoom - 1x to 3x digital zoom
✓ Focus - Continuous or manual focus
✓ Camera Switch - Front/back camera toggle
```

---

### 3. **QR Code Scanning** 🎯
**File**: `src/QRScanner.jsx` (Lines 210-228)

**What happens when QR code is detected:**

```javascript
1. Scanner detects QR code
2. Extracts raw data (JSON string)
3. Triggers haptic feedback (vibration)
4. Plays audio beep
5. Sends data to backend for verification
```

**QR Code Data Format:**
```json
{
  "ticketNumber": "ACD2025-123456789",
  "registrationId": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "eventCode": "ACD-2025",
  "generatedAt": "2026-01-09T08:30:00.000Z"
}
```

---

### 4. **Backend Verification** ✅
**File**: `backend/controllers/ticketController.js`

**API Endpoint**: `POST /api/tickets/verify`

**Verification Process:**

```javascript
Step 1: Parse QR Data
  ↓
Step 2: Validate Event Code (must be "ACD-2025")
  ↓
Step 3: Find Registration in Database
  ↓
Step 4: Check Payment Status (must be "completed")
  ↓
Step 5: Check if Already Entered
  ↓
Step 6: Return Verification Result
```

**Backend Code Flow:**
```javascript
// 1. Parse and validate QR data
const qrData = JSON.parse(request.qrData)

// 2. Check event code
if (qrData.eventCode !== 'ACD-2025') {
  return { valid: false, error: 'Invalid event ticket' }
}

// 3. Find registration
const registration = await Registration.findById(qrData.registrationId)

// 4. Verify payment completed
if (registration.paymentStatus !== 'completed') {
  return { valid: false, error: 'Payment not completed' }
}

// 5. Check if already entered
if (registration.isScanned && registration.entryConfirmed) {
  return { 
    valid: true, 
    hasEntered: true,
    entryTime: registration.scannedAt 
  }
}

// 6. Return success
return {
  valid: true,
  hasEntered: false,
  data: { name, email, college, year, ticketNumber, amount }
}
```

---

### 5. **Display Verification Result** 📊
**File**: `src/QRScanner.jsx` (Lines 453-516)

**If Valid Ticket:**
```
✅ Ticket Details Displayed:
- Name
- Email
- College
- Year
- Ticket Number
- Amount Paid
- Status: "Valid for Entry" or "Already Entered"
```

**If Invalid Ticket:**
```
❌ Error Message Displayed:
- "Invalid ticket"
- "Payment not completed"
- "Invalid event ticket"
- "Ticket not found"
```

---

### 6. **Entry Confirmation** 🎉
**File**: `src/QRScanner.jsx` (Lines 169-208)

**API Endpoint**: `POST /api/tickets/confirm-entry`

**What happens when staff clicks "Confirm Entry":**

```javascript
1. Send confirmation request to backend
   ↓
2. Backend updates database:
   - isScanned = true
   - scannedAt = current timestamp
   - entryConfirmed = true
   ↓
3. Display success message
   ↓
4. Auto-reset after 3 seconds for next scan
```

**Database Updates:**
```javascript
{
  isScanned: true,
  scannedAt: new Date(),
  entryConfirmed: true
}
```

---

## 🎨 Scanner UI Features

### Visual Elements:
1. **Scanning Frame** - Corner guides showing scan area
2. **Scanning Line** - Animated green line
3. **Camera Controls** - Settings, flash, focus buttons
4. **Status Display** - Loading, success, error messages

### Camera Controls:
```
⚙️ Settings - Access advanced controls
🔦 Flash - Toggle flashlight
🔍 Focus - Manual focus trigger
🔄 Camera Switch - Front/back toggle
🔍 Zoom Slider - 1x to 3x zoom
```

---

## 🔒 Security Features

### 1. **Authentication Required**
- Must login before using scanner
- Credentials stored locally
- Can logout anytime

### 2. **Event Code Validation**
- QR must contain correct event code ("ACD-2025")
- Prevents scanning tickets from other events

### 3. **Payment Verification**
- Only tickets with "completed" payment status are valid
- Prevents entry with pending/failed payments

### 4. **Duplicate Entry Prevention**
- Checks if ticket already used
- Shows entry time if already scanned
- Prevents re-entry with same ticket

---

## 📱 Mobile Optimization

### Features:
- **Responsive Design** - Works on all screen sizes
- **Touch Optimized** - Large buttons for easy tapping
- **Auto-Focus** - Continuous focus for sharp QR codes
- **Haptic Feedback** - Vibration on successful scan
- **Audio Feedback** - Beep sound on scan
- **Low Light Support** - Flash/torch control

### Browser Compatibility:
- ✅ Chrome (Android/iOS)
- ✅ Safari (iOS)
- ✅ Firefox (Android)
- ✅ Edge (Android)

---

## 🚀 Usage Instructions

### For Event Staff:

1. **Open Scanner**
   ```
   Navigate to: https://your-domain.com/scanner
   ```

2. **Login**
   ```
   Username: scanner
   Password: scanner123
   ```

3. **Grant Camera Permission**
   - Browser will ask for camera access
   - Click "Allow"

4. **Scan Tickets**
   - Position QR code within corner guides
   - Wait for automatic scan
   - Review ticket details

5. **Confirm Entry**
   - Verify attendee details match
   - Click "Confirm Entry"
   - Wait for success message
   - Ready for next scan

6. **Troubleshooting**
   - **Can't scan?** → Use flash in low light
   - **Blurry?** → Tap focus button
   - **Too far?** → Use zoom slider
   - **Wrong camera?** → Switch camera in settings

---

## 🔧 Technical Details

### Libraries Used:
```javascript
"@yudiel/react-qr-scanner": "^2.0.8"  // QR scanning
```

### API Endpoints:
```javascript
POST /api/tickets/verify          // Verify QR code
POST /api/tickets/confirm-entry   // Confirm entry
```

### Database Fields Updated:
```javascript
isScanned: Boolean        // Ticket has been scanned
scannedAt: Date          // When ticket was scanned
entryConfirmed: Boolean  // Entry was confirmed
```

---

## 📊 Scanner Statistics

The scanner tracks:
- ✅ Total scans
- ✅ Successful entries
- ❌ Failed verifications
- 🔄 Duplicate scan attempts
- ⏱️ Entry timestamps

---

## 🎯 Key Features Summary

| Feature | Description |
|---------|-------------|
| **Auto-Focus** | Continuous focus for sharp QR codes |
| **Flash Control** | Toggle flashlight for low light |
| **Zoom** | 1x to 3x digital zoom |
| **Haptic Feedback** | Vibration on successful scan |
| **Audio Feedback** | Beep sound on scan |
| **Duplicate Prevention** | Prevents re-entry |
| **Real-time Validation** | Instant ticket verification |
| **Offline Detection** | Shows error if backend unavailable |

---

## 🐛 Error Handling

### Common Errors:

1. **"Camera permission denied"**
   - User denied camera access
   - Solution: Grant permission in browser settings

2. **"No camera found"**
   - Device has no camera
   - Solution: Use different device

3. **"Camera being used by another app"**
   - Another app is using camera
   - Solution: Close other camera apps

4. **"Invalid ticket"**
   - QR code is not valid
   - Solution: Check ticket is genuine

5. **"Payment not completed"**
   - Ticket payment not verified
   - Solution: Admin must verify payment first

6. **"Already entered"**
   - Ticket already used
   - Shows original entry time
   - Solution: Check for duplicate tickets

---

## 🔐 Access Control

### Scanner Route Protection:
```javascript
Route: /scanner
Authentication: Required
Credentials: Stored in ScannerAuth component
Logout: Available in scanner interface
```

### Admin vs Scanner:
- **Admin** (`/admin/*`) - Full dashboard access
- **Scanner** (`/scanner`) - Only scanning functionality
- Separate authentication systems
- Different use cases

---

## 📝 Best Practices

### For Event Staff:
1. ✅ Test scanner before event starts
2. ✅ Ensure good lighting at entrance
3. ✅ Keep device charged
4. ✅ Have backup device ready
5. ✅ Verify attendee details match ticket
6. ✅ Watch for duplicate entry attempts

### For Admins:
1. ✅ Verify all payments before event
2. ✅ Test scanner with sample tickets
3. ✅ Ensure backend is running
4. ✅ Monitor entry statistics
5. ✅ Have manual backup process ready

---

## 🎉 Success Flow Example

```
1. Attendee arrives with ticket (email/printed)
   ↓
2. Staff opens scanner on phone/tablet
   ↓
3. Scanner camera activates
   ↓
4. Attendee shows QR code
   ↓
5. Scanner auto-detects and scans
   ↓
6. Vibration + Beep (feedback)
   ↓
7. Ticket details displayed
   ↓
8. Staff verifies: "John Doe, MIT, 3rd Year"
   ↓
9. Staff clicks "Confirm Entry"
   ↓
10. Success message: "Welcome to ACD 2025!"
   ↓
11. Auto-reset after 3 seconds
   ↓
12. Ready for next attendee
```

---

## 🔄 Database Flow

```
Ticket Generated (Email sent)
  ↓
QR Code Created
  ↓
Attendee Arrives
  ↓
Scanner Scans QR
  ↓
Backend Verifies:
  - Registration exists?
  - Payment completed?
  - Not already entered?
  ↓
Staff Confirms Entry
  ↓
Database Updated:
  - isScanned: true
  - scannedAt: timestamp
  - entryConfirmed: true
  ↓
Entry Complete ✅
```

---

## 🎯 Quick Reference

### Scanner URL:
```
http://localhost:5173/scanner (development)
https://your-domain.com/scanner (production)
```

### Default Credentials:
```
Username: scanner
Password: scanner123
```

### To Change Credentials:
Edit `src/ScannerAuth.jsx` - Lines with hardcoded credentials

### To Test:
1. Create a test registration
2. Admin approves payment
3. Ticket email sent with QR code
4. Open scanner
5. Scan the QR code from email
6. Verify it works

---

**The scanner is fully functional and ready for your event!** 🎉
