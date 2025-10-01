# SHAKTI Admin Dashboard

A comprehensive admin dashboard for managing the SHAKTI event at MIT Academy of Engineering, Alandi.

## Features

### 📊 Real-time Analytics
- **Total Tickets Sent**: Track how many tickets have been distributed
- **Check-in Status**: Monitor live check-ins during the event
- **Attendance Rate**: Real-time calculation of attendance percentage
- **Timeline Charts**: Visual representation of check-in patterns

### 👥 Attendee Management
- **Complete Attendee List**: View all registered participants
- **Check-in Status**: See who has checked in and when
- **Attendee Details**: Full information including college, department, year
- **Search & Filter**: Easily find specific attendees

### 🔧 Admin Tools
- **Send Reminder Emails**: Bulk email reminders to non-checked-in attendees
- **Export Data**: Download complete attendee data as CSV/JSON
- **Reset Check-ins**: Admin ability to reset check-in status if needed
- **Update Attendee Info**: Edit attendee details as needed

### 📈 Visual Analytics
- **Check-in Timeline**: Line chart showing check-ins over time
- **Attendance Distribution**: Pie chart of checked-in vs not checked-in
- **Real-time Updates**: Dashboard refreshes every 30 seconds
- **Mobile Responsive**: Works on all devices

## Technology Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript with Chart.js
- **Backend**: Node.js serverless functions
- **Database**: MongoDB Atlas (shared with main ticket system)
- **Deployment**: Vercel
- **Authentication**: JWT-based admin authentication
- **Email**: Nodemailer for reminder emails

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# MongoDB (same as main project)
MONGODB_URI=your_mongodb_connection_string

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret

# Event Configuration
EVENT_NAME=SHAKTI
EVENT_DATE=2025-10-15
EVENT_VENUE=MIT Academy of Engineering, Alandi
ORGANIZER=ACES MIT ADT

# Email Configuration
EMAIL_HOST=your_email_host
EMAIL_PORT=465
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_email_password
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3. Set Environment Variables in Vercel
Configure all environment variables in your Vercel dashboard.

## API Endpoints

### `/api/dashboard` (GET)
Returns complete dashboard data including:
- Statistics (total tickets, check-ins, attendance rate)
- Timeline data for charts
- Complete attendee list with status

### `/api/auth` (POST)
Admin authentication endpoint:
```json
{
  "username": "admin",
  "password": "your_password"
}
```

### `/api/admin` (GET/POST)
Admin operations:
- **GET**: Recent activity logs
- **POST**: Various admin actions (send reminders, export data, etc.)

## Security Features

- **JWT Authentication**: Secure admin access
- **CORS Protection**: Configured for security
- **Environment Variables**: Sensitive data protected
- **Input Validation**: All inputs validated and sanitized

## Database Schema

Uses the same MongoDB collection as the main ticket system:

```javascript
{
  ticketId: String,
  name: String,
  email: String,
  phone: String,
  collegeName: String,
  department: String,
  year: String,
  isCheckedIn: Boolean,
  checkInTime: Date,
  createdAt: Date
}
```

## Usage

1. **Access Dashboard**: Open the deployed URL
2. **Login**: Use admin credentials (if authentication is enabled)
3. **Monitor Event**: View real-time statistics and attendee status
4. **Manage Attendees**: Use admin tools for event management
5. **Export Data**: Download complete reports for analysis

## Auto-refresh

The dashboard automatically refreshes every 30 seconds to show live data. Manual refresh is also available via the refresh button.

## Mobile Support

Fully responsive design works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## Support

For technical support or questions:
- Email: official@acesmitadt.com
- Organization: ACES MIT ADT

---

**SHAKTI Event Management System**  
*MIT Academy of Engineering, Alandi*