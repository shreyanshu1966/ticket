import { connectToDatabase } from './database.js';
import { Attendee, Ticket, AttendanceLog } from './models.js';

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
    await connectToDatabase();

    // Get all attendees with their tickets
    const attendeesWithTickets = await Attendee.aggregate([
      {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'attendeeId',
          as: 'ticket'
        }
      },
      {
        $unwind: {
          path: '$ticket',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);
    
    // Calculate statistics
    const stats = {
      totalAttendees: attendeesWithTickets.length,
      checkedIn: attendeesWithTickets.filter(a => a.status === 'attended').length,
      totalTickets: attendeesWithTickets.filter(a => a.ticket).length,
      attendanceRate: attendeesWithTickets.length > 0 
        ? Math.round((attendeesWithTickets.filter(a => a.status === 'attended').length / attendeesWithTickets.length) * 100)
        : 0
    };

    // Generate timeline data (check-ins by hour)
    const timeline = generateTimelineData(attendeesWithTickets);

    // Prepare attendee data for table (sorted by check-in status, then by name)
    const sortedAttendees = attendeesWithTickets
      .sort((a, b) => {
        const aAttended = a.status === 'attended';
        const bAttended = b.status === 'attended';
        if (aAttended !== bAttended) {
          return bAttended - aAttended; // Attended first
        }
        return (a.name || '').localeCompare(b.name || '');
      })
      .map(attendee => ({
        name: attendee.name,
        email: attendee.email,
        collegeName: attendee.college,
        department: attendee.department,
        year: attendee.year,
        isCheckedIn: attendee.status === 'attended',
        checkInTime: attendee.status === 'attended' ? (attendee.updatedAt || attendee.createdAt) : null,
        ticketId: attendee.ticket ? attendee.ticket.ticketId : null
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
  const attendedAttendees = attendees.filter(a => a.status === 'attended' && a.updatedAt);
  
  if (attendedAttendees.length === 0) {
    return {
      labels: ['No data'],
      data: [0]
    };
  }

  // Group check-ins by hour
  const hourlyData = {};
  
  attendedAttendees.forEach(attendee => {
    const checkInDate = new Date(attendee.updatedAt);
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