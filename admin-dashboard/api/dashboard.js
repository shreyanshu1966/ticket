import { connectToDatabase } from './database.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection('attendees');

    // Get all attendees
    const attendees = await collection.find({}).toArray();
    
    // Calculate statistics
    const stats = {
      totalAttendees: attendees.length,
      checkedIn: attendees.filter(a => a.isCheckedIn).length,
      totalTickets: attendees.length, // Assuming each attendee got a ticket
      attendanceRate: attendees.length > 0 
        ? Math.round((attendees.filter(a => a.isCheckedIn).length / attendees.length) * 100)
        : 0
    };

    // Generate timeline data (check-ins by hour)
    const timeline = generateTimelineData(attendees);

    // Prepare attendee data for table (sorted by check-in status, then by name)
    const sortedAttendees = attendees
      .sort((a, b) => {
        if (a.isCheckedIn !== b.isCheckedIn) {
          return b.isCheckedIn - a.isCheckedIn; // Checked in first
        }
        return (a.name || '').localeCompare(b.name || '');
      })
      .map(attendee => ({
        name: attendee.name,
        email: attendee.email,
        collegeName: attendee.collegeName,
        department: attendee.department,
        year: attendee.year,
        isCheckedIn: attendee.isCheckedIn || false,
        checkInTime: attendee.checkInTime || null,
        ticketId: attendee.ticketId
      }));

    const dashboardData = {
      stats,
      timeline,
      attendees: sortedAttendees,
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json(dashboardData);

  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    });
  }
}

function generateTimelineData(attendees) {
  const checkedInAttendees = attendees.filter(a => a.isCheckedIn && a.checkInTime);
  
  if (checkedInAttendees.length === 0) {
    return {
      labels: ['No data'],
      data: [0]
    };
  }

  // Group check-ins by hour
  const hourlyData = {};
  
  checkedInAttendees.forEach(attendee => {
    const checkInDate = new Date(attendee.checkInTime);
    const hour = checkInDate.getHours();
    const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
    
    if (!hourlyData[timeLabel]) {
      hourlyData[timeLabel] = 0;
    }
    hourlyData[timeLabel]++;
  });

  // Sort by time and prepare chart data
  const sortedHours = Object.keys(hourlyData).sort();
  const labels = sortedHours;
  const data = sortedHours.map(hour => hourlyData[hour]);

  return { labels, data };
}