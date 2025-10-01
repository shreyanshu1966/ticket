# MongoDB Setup Guide for SHAKTI Ticket Sender

This guide explains how to set up and use MongoDB with the SHAKTI ticket sender application.

## Prerequisites

### Option 1: Local MongoDB Installation
1. Download and install MongoDB Community Server from [MongoDB Downloads](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   - **Windows**: MongoDB should start automatically as a service
   - **macOS**: `brew services start mongodb/brew/mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

### Option 2: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Add your IP address to the whitelist
4. Create a database user
5. Get your connection string

## Configuration

1. Copy the environment template:
   ```powershell
   Copy-Item .env.template .env
   ```

2. Edit `.env` file with your MongoDB connection details:

   **For Local MongoDB:**
   ```
   MONGODB_URI=mongodb://localhost:27017/shakti_tickets
   ```

   **For MongoDB Atlas:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shakti_tickets?retryWrites=true&w=majority
   ```

   **For Local MongoDB with Authentication:**
   ```
   MONGODB_URI=mongodb://username:password@localhost:27017/shakti_tickets
   ```

## Testing the Connection

Run the MongoDB connection test:
```powershell
npm run test-mongodb
```

This will:
- Test the database connection
- Create sample data
- Verify all operations work correctly
- Clean up test data
- Show connection statistics

## Database Schema

The application creates the following collections:

### attendees
- Stores attendee information from CSV
- Tracks registration status
- Includes contact details and additional data

### tickets
- Stores generated tickets with QR codes
- Links to attendees
- Tracks email sending status

### email_logs
- Logs all email attempts
- Includes success/failure status
- Stores error messages for debugging

### event_stats
- Tracks overall event statistics
- Registration counts, email counts, etc.
- Status breakdowns

## Running the Application

### Basic Usage (MongoDB Edition)
```powershell
npm run start-mongodb
```

### What the MongoDB Version Does

1. **Import Data**: Reads CSV file and saves attendees to MongoDB
2. **Generate Tickets**: Creates unique tickets with QR codes
3. **Send Emails**: Sends tickets via email with full logging
4. **Track Status**: Updates attendee and ticket status in real-time
5. **Statistics**: Maintains comprehensive event statistics
6. **Error Handling**: Logs all errors for debugging

### Advantages of MongoDB Version

- **Data Persistence**: All data is saved to database
- **Comprehensive Logging**: Track every email attempt
- **Status Tracking**: Know exactly who received tickets
- **Statistics**: Real-time event metrics
- **Resumable**: Can restart without losing progress
- **Audit Trail**: Complete history of all operations
- **Scalability**: Handle thousands of attendees efficiently

## Duplicate Prevention

### 🔒 Built-in Duplicate Protection

The MongoDB version includes comprehensive duplicate prevention:

#### Database-Level Constraints
- **Unique Email Addresses**: Each email can only register once
- **One Ticket Per Attendee**: Each attendee can only have one ticket
- **Unique Ticket IDs**: All ticket IDs are globally unique

#### Application-Level Checks
- **Smart Import**: Automatically detects and skips duplicate attendees during CSV import
- **Ticket Generation**: Checks for existing tickets before creating new ones
- **Email Sending**: Only sends emails to attendees who haven't received them

### 🔍 Duplicate Checking Tools

#### Check for Duplicates
```powershell
npm run check-duplicates
```

This comprehensive check will:
- Identify duplicate attendees by email
- Find duplicate ticket IDs
- Locate attendees with multiple tickets
- Show attendees without tickets
- Generate integrity reports

#### Test Duplicate Prevention
```powershell
npm run test-mongodb
```

This test verifies:
- Email uniqueness enforcement
- One ticket per attendee rule
- Ticket ID uniqueness
- Error handling for duplicates

### 📊 Data Integrity Guarantees

| Constraint | Enforced By | Description |
|------------|-------------|-------------|
| Unique Emails | MongoDB Index | One email = One attendee |
| One Ticket Per Attendee | MongoDB Index | One attendee = One ticket |
| Unique Ticket IDs | MongoDB Index | All ticket IDs are unique |
| Smart CSV Import | Application Logic | Skips duplicate entries |
| Resume Safety | Application Logic | Safe to restart without duplicates |

### 🛠️ Manual Duplicate Handling

If you need to handle edge cases manually:

```javascript
const DuplicateChecker = require('./duplicate-checker');

// Get comprehensive integrity report
const report = await DuplicateChecker.getIntegrityReport();

// Find duplicate attendees
const duplicates = await DuplicateChecker.findDuplicateAttendees();

// Find attendees without tickets
const withoutTickets = await DuplicateChecker.getAttendeesWithoutTickets();
```

### View Statistics
The application automatically tracks:
- Total registrations
- Tickets sent successfully
- Failed email attempts
- Attendee status breakdown

### Query Examples

After running the application, you can query the database directly:

```javascript
// Connect to MongoDB shell or use MongoDB Compass

// Count total attendees
db.attendees.countDocuments()

// Find attendees who haven't received tickets
db.attendees.find({"status": "registered"})

// Count successful ticket emails
db.tickets.countDocuments({"emailSent": true})

// View failed email attempts
db.email_logs.find({"status": "failed"})

// Get event statistics
db.event_stats.findOne({"eventName": "SHAKTI"})
```

## Troubleshooting

### Connection Issues
1. Verify MongoDB is running: `mongosh` (command line)
2. Check your MONGODB_URI in .env
3. For Atlas: ensure IP whitelist and credentials are correct
4. Run `npm run test-mongodb` to diagnose issues

### Common Error Messages
- **"Connection refused"**: MongoDB service not running
- **"Authentication failed"**: Wrong username/password
- **"Network timeout"**: Check firewall/network settings
- **"Database name invalid"**: Check URI format

### Performance Tips
- The application includes connection pooling
- Automatic retry logic for failed operations
- Indexed collections for fast queries
- Optimized bulk operations

## Data Backup

To backup your data:
```bash
# Export all collections
mongodump --db shakti_tickets --out ./backup

# Restore from backup
mongorestore --db shakti_tickets ./backup/shakti_tickets
```

## Security Notes

- Never commit .env file to version control
- Use strong passwords for database users
- Restrict IP access in MongoDB Atlas
- Enable authentication for production use
- Regularly backup your data

## Support

If you encounter issues:
1. Check the console output for detailed error messages
2. Run `npm run test-mongodb` to verify setup
3. Check MongoDB logs for connection issues
4. Verify your .env configuration
5. Ensure MongoDB service is running

The MongoDB version provides enterprise-grade data management for your event ticket system!