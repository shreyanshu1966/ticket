import { connectToDatabase } from './database.js';
import { Attendee, Ticket, AttendanceLog } from './models.js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      // Get recent activity logs
      const recentActivity = await Attendee
        .find({ status: 'attended' })
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean();

      const activityLogs = recentActivity.map(attendee => ({
        name: attendee.name,
        email: attendee.email,
        checkInTime: attendee.updatedAt,
        collegeName: attendee.college,
        department: attendee.department
      }));

      res.status(200).json({
        success: true,
        logs: activityLogs,
        total: recentActivity.length
      });

    } else if (req.method === 'POST') {
      const { action, data } = req.body;

      switch (action) {
        case 'send_reminder':
          await sendReminderEmails(data);
          res.status(200).json({ success: true, message: 'Reminder emails sent' });
          break;

        case 'export_data':
          const exportData = await exportAttendeeData();
          res.status(200).json({ success: true, data: exportData });
          break;

        case 'reset_checkin':
          if (data.ticketId) {
            // Find attendee by ticket and reset their status
            const ticket = await Ticket.findOne({ ticketId: data.ticketId }).lean();
            if (ticket) {
              await Attendee.updateOne(
                { _id: ticket.attendeeId },
                { $set: { status: 'ticket_sent' } }
              );
              res.status(200).json({ success: true, message: 'Check-in reset' });
            } else {
              res.status(404).json({ error: 'Ticket not found' });
            }
          } else {
            res.status(400).json({ error: 'Ticket ID required' });
          }
          break;

        case 'update_attendee':
          if (data.ticketId) {
            const ticket = await Ticket.findOne({ ticketId: data.ticketId }).lean();
            if (ticket) {
              const updateData = { ...data };
              delete updateData.ticketId; // Don't update the ticket ID itself
              
              await Attendee.updateOne(
                { _id: ticket.attendeeId },
                { $set: updateData }
              );
              res.status(200).json({ success: true, message: 'Attendee updated' });
            } else {
              res.status(404).json({ error: 'Ticket not found' });
            }
          } else {
            res.status(400).json({ error: 'Ticket ID required' });
          }
          break;

        default:
          res.status(400).json({ error: 'Invalid action' });
      }

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Admin API error:', error);
    res.status(500).json({
      error: 'Admin operation failed',
      details: error.message
    });
  }
}

async function sendReminderEmails(data) {
  // Get attendees who haven't checked in (don't have status 'attended')
  const notCheckedIn = await Attendee
    .find({ 
      status: { $ne: 'attended' },
      email: { $exists: true, $ne: "" }
    })
    .lean();

  if (notCheckedIn.length === 0) {
    return { sent: 0, message: 'No attendees to send reminders to' };
  }

  // Create email transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  let sentCount = 0;
  
  for (const attendee of notCheckedIn.slice(0, 10)) { // Limit to 10 emails per request
    try {
      await transporter.sendMail({
        from: `"SHAKTI Event" <${process.env.EMAIL_USER}>`,
        to: attendee.email,
        subject: 'SHAKTI Event - Check-in Reminder',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">SHAKTI Event Reminder</h2>
            <p>Dear ${attendee.name},</p>
            <p>This is a friendly reminder about the SHAKTI event at MIT Academy of Engineering, Alandi.</p>
            <p>We notice you haven't checked in yet. Please make sure to bring your QR code for quick check-in.</p>
            <p>Event Details:</p>
            <ul>
              <li>Date: ${process.env.EVENT_DATE}</li>
              <li>Venue: ${process.env.EVENT_VENUE}</li>
            </ul>
            <p>Looking forward to seeing you there!</p>
            <hr>
            <p><small>ACES MIT ADT</small></p>
          </div>
        `
      });
      sentCount++;
    } catch (emailError) {
      console.error(`Failed to send email to ${attendee.email}:`, emailError);
    }
  }

  return { sent: sentCount, total: notCheckedIn.length };
}

async function exportAttendeeData() {
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
    }
  ]);
  
  return attendeesWithTickets.map(attendee => ({
    ticketId: attendee.ticket ? attendee.ticket.ticketId : null,
    name: attendee.name,
    email: attendee.email,
    phone: attendee.phone,
    collegeName: attendee.college,
    department: attendee.department,
    year: attendee.year,
    isCheckedIn: attendee.status === 'attended',
    checkInTime: attendee.status === 'attended' ? attendee.updatedAt : null,
    createdAt: attendee.createdAt || null
  }));
}