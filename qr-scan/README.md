# SHAKTI QR Scanner - Deployment Guide

## 🚀 Vercel Deployment Instructions

### Prerequisites
1. GitHub/GitLab account
2. Vercel account (free tier is sufficient)
3. MongoDB Atlas database (or your existing MongoDB)

### Step 1: Environment Variables
Set these environment variables in your Vercel project settings:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shakti-db
ADMIN_SECRET=your-secure-admin-secret-here
NODE_ENV=production
```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to qr-scan folder
cd qr-scan

# Deploy
vercel --prod
```

#### Option B: Deploy via GitHub Integration
1. Push the `qr-scan` folder to a GitHub repository
2. Connect your GitHub repo to Vercel
3. Set the build settings:
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: public
   - Install Command: npm install

### Step 3: Configure MongoDB
Ensure your MongoDB has these collections:
- `attendees` - User information
- `tickets` - Ticket data with QR codes
- `attendancelogs` - Scan history

### Step 4: Test Deployment
1. Visit your Vercel domain
2. Test the QR scanner with a valid ticket QR code
3. Verify attendance logging in MongoDB

## 📱 QR Scanner Features

### Core Functionality
- **Camera-based QR scanning** - Uses device camera to scan QR codes
- **Manual ticket entry** - Manual input for ticket IDs
- **Real-time validation** - Instant feedback on scan results
- **Duplicate detection** - Prevents multiple check-ins
- **Attendance logging** - Comprehensive scan history

### User Interface
- **Responsive design** - Works on desktop and mobile
- **Real-time stats** - Live attendance statistics
- **Visual feedback** - Color-coded status messages
- **Attendee information** - Shows scanned user details

### Admin Features
- **Statistics dashboard** - Total attendees, attendance rate
- **Scan history** - Detailed logs with timestamps
- **Manual override** - Force attendance updates

## 🔧 Configuration

### Admin Access
Use the admin secret in requests to access statistics:
```javascript
headers: {
    'X-Admin-Secret': 'your-admin-secret'
}
```

### QR Code Format
Expected QR code JSON structure:
```json
{
    "ticketId": "SHAKTI2025-ABC123456-001",
    "name": "John Doe",
    "email": "john@example.com",
    "event": "SHAKTI",
    "timestamp": "2025-01-11T10:00:00.000Z"
}
```

## 🛠️ API Endpoints

### POST /api/scan
Mark attendance for a scanned QR code
```json
{
    "qrData": "QR code content",
    "scanLocation": "Main Entrance",
    "scannerOperator": "Staff Name"
}
```

### GET /api/scan?action=stats
Get event statistics (requires admin secret)
```json
{
    "success": true,
    "stats": {
        "totalAttendees": 250,
        "attendedCount": 180,
        "attendanceRate": "72%",
        "todayScans": 45
    }
}
```

## 🚨 Troubleshooting

### Common Issues

#### Camera Not Working
- Check browser permissions
- Ensure HTTPS (required for camera access)
- Try different browsers (Chrome/Safari recommended)

#### Database Connection Issues
- Verify MongoDB URI in environment variables
- Check IP whitelist in MongoDB Atlas
- Ensure database name matches configuration

#### QR Code Not Scanning
- Verify QR code contains valid JSON
- Check ticket ID format
- Ensure good lighting and camera focus

### Error Messages
- **"Ticket not found"** - Invalid ticket ID or not in database
- **"Already attended"** - User has already checked in
- **"Network error"** - Connection issues or server down
- **"Camera permission denied"** - Browser camera access blocked

## 📊 Monitoring

### Logs
- Check Vercel function logs for errors
- Monitor MongoDB connection status
- Track scan success/failure rates

### Performance
- Function cold start time: ~2-3 seconds
- Average scan processing: <500ms
- Concurrent user limit: 100+ (Vercel free tier)

## 🔒 Security

### Data Protection
- All communication over HTTPS
- Admin operations require secret key
- No sensitive data stored in frontend

### Access Control
- Camera permission required for scanning
- Admin functions protected by secret
- Rate limiting on API endpoints

## 📞 Support

For issues or questions:
1. Check the error messages in browser console
2. Verify environment variables in Vercel
3. Test with a simple QR code first
4. Check MongoDB connection and data

---

**Deployment Domain**: Your Vercel domain will be something like:
`https://your-project-name.vercel.app`

The QR scanner will be available at the root URL and ready to use immediately after deployment.