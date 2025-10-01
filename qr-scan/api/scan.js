// api/scan.js - Main QR code scanning and attendance marking API
const connectToDatabase = require('./database');
const { Attendee, Ticket, AttendanceLog } = require('./models');

// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
    'Access-Control-Max-Age': '86400',
};

// Helper function to validate admin secret
const validateAdminSecret = (req) => {
    const adminSecret = process.env.ADMIN_SECRET || 'shakti-admin-2025';
    const providedSecret = req.headers['x-admin-secret'] || req.headers['authorization']?.replace('Bearer ', '');
    return providedSecret === adminSecret;
};

// Helper function to parse QR code data
const parseQRData = (qrDataString) => {
    try {
        // Try to parse as JSON first
        const qrData = JSON.parse(qrDataString);
        
        // Validate required fields
        if (!qrData.ticketId || !qrData.name || !qrData.email) {
            throw new Error('Missing required fields in QR code');
        }
        
        return {
            ticketId: qrData.ticketId.toString().toUpperCase(),
            name: qrData.name,
            email: qrData.email.toLowerCase(),
            event: qrData.event,
            date: qrData.date,
            venue: qrData.venue,
            timestamp: qrData.timestamp
        };
    } catch (error) {
        // If JSON parsing fails, try to extract ticket ID from string
        const ticketIdMatch = qrDataString.match(/SHAKTI2025-[A-Z0-9-]+/i);
        if (ticketIdMatch) {
            return {
                ticketId: ticketIdMatch[0].toUpperCase(),
                rawData: qrDataString
            };
        }
        throw new Error('Invalid QR code format');
    }
};

// Main handler function
module.exports = async (req, res) => {
    // Handle preflight CORS requests
    if (req.method === 'OPTIONS') {
        return res.status(200).json({ message: 'OK' });
    }

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    try {
        // Connect to database
        await connectToDatabase();

        const { method, body, query, headers } = req;
        const userAgent = headers['user-agent'] || 'Unknown';
        const ipAddress = headers['x-forwarded-for'] || headers['x-real-ip'] || 'Unknown';

        // GET /api/scan - Get scanning interface or ticket info
        if (method === 'GET') {
            const { ticketId, action } = query;

            // Get ticket information
            if (action === 'info' && ticketId) {
                try {
                    const ticket = await Ticket.findOne({ 
                        ticketId: ticketId.toUpperCase() 
                    }).populate('attendeeId');

                    if (!ticket) {
                        return res.status(404).json({
                            success: false,
                            error: 'Ticket not found',
                            ticketId
                        });
                    }

                    const attendee = ticket.attendeeId;
                    const attendanceLogs = await AttendanceLog.find({ 
                        ticketId: ticket.ticketId 
                    }).sort({ scanTime: -1 });

                    return res.status(200).json({
                        success: true,
                        ticket: {
                            ticketId: ticket.ticketId,
                            attendeeName: ticket.attendeeName,
                            attendeeEmail: ticket.attendeeEmail,
                            eventName: ticket.eventName,
                            eventDate: ticket.eventDate,
                            eventTime: ticket.eventTime,
                            eventVenue: ticket.eventVenue,
                            isVerified: ticket.isVerified,
                            verifiedAt: ticket.verifiedAt
                        },
                        attendee: {
                            name: attendee.name,
                            email: attendee.email,
                            phone: attendee.phone,
                            college: attendee.college,
                            department: attendee.department,
                            year: attendee.year,
                            status: attendee.status
                        },
                        attendance: {
                            hasAttended: attendee.status === 'attended',
                            scanCount: attendanceLogs.length,
                            lastScan: attendanceLogs[0]?.scanTime,
                            logs: attendanceLogs.slice(0, 5) // Last 5 scans
                        }
                    });
                } catch (error) {
                    console.error('Error fetching ticket info:', error);
                    return res.status(500).json({
                        success: false,
                        error: 'Database error',
                        message: error.message
                    });
                }
            }

            // Get scanning statistics (admin only)
            if (action === 'stats') {
                if (!validateAdminSecret(req)) {
                    return res.status(401).json({
                        success: false,
                        error: 'Unauthorized'
                    });
                }

                try {
                    const totalAttendees = await Attendee.countDocuments();
                    const totalTickets = await Ticket.countDocuments();
                    const attendedCount = await Attendee.countDocuments({ status: 'attended' });
                    const totalScans = await AttendanceLog.countDocuments();
                    const todayScans = await AttendanceLog.countDocuments({
                        scanTime: {
                            $gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    });

                    return res.status(200).json({
                        success: true,
                        stats: {
                            totalAttendees,
                            totalTickets,
                            attendedCount,
                            attendanceRate: totalAttendees > 0 ? ((attendedCount / totalAttendees) * 100).toFixed(2) + '%' : '0%',
                            totalScans,
                            todayScans,
                            lastUpdated: new Date()
                        }
                    });
                } catch (error) {
                    console.error('Error fetching stats:', error);
                    return res.status(500).json({
                        success: false,
                        error: 'Database error',
                        message: error.message
                    });
                }
            }

            // Default response for GET requests
            return res.status(200).json({
                success: true,
                message: 'SHAKTI QR Scanner API',
                version: '1.0.0',
                endpoints: {
                    scan: 'POST /api/scan',
                    info: 'GET /api/scan?action=info&ticketId=TICKET_ID',
                    stats: 'GET /api/scan?action=stats (admin only)'
                }
            });
        }

        // POST /api/scan - Process QR code scan
        if (method === 'POST') {
            const { qrData, scanLocation, scannerOperator, notes } = body;

            if (!qrData) {
                return res.status(400).json({
                    success: false,
                    error: 'QR data is required'
                });
            }

            try {
                // Parse QR code data
                const parsedQR = parseQRData(qrData);
                const { ticketId } = parsedQR;

                console.log(`Processing scan for ticket: ${ticketId}`);

                // Find the ticket
                const ticket = await Ticket.findOne({ 
                    ticketId: ticketId 
                }).populate('attendeeId');

                if (!ticket) {
                    // Log invalid scan attempt
                    await AttendanceLog.create({
                        ticketId: ticketId,
                        attendeeId: null,
                        attendeeName: 'Unknown',
                        attendeeEmail: 'unknown@invalid.com',
                        scanLocation: scanLocation || 'Event Entrance',
                        scannerOperator: scannerOperator || 'QR Scanner',
                        scanResult: 'invalid',
                        notes: `Invalid ticket ID: ${ticketId}`,
                        ipAddress,
                        userAgent
                    });

                    return res.status(404).json({
                        success: false,
                        error: 'Invalid ticket',
                        message: 'Ticket not found in database',
                        ticketId
                    });
                }

                const attendee = ticket.attendeeId;

                // Check if already attended
                if (attendee.status === 'attended') {
                    // Log duplicate scan
                    await AttendanceLog.create({
                        ticketId: ticket.ticketId,
                        attendeeId: attendee._id,
                        attendeeName: attendee.name,
                        attendeeEmail: attendee.email,
                        scanLocation: scanLocation || 'Event Entrance',
                        scannerOperator: scannerOperator || 'QR Scanner',
                        scanResult: 'duplicate',
                        notes: notes || 'Duplicate scan - already attended',
                        ipAddress,
                        userAgent
                    });

                    return res.status(200).json({
                        success: true,
                        alreadyAttended: true,
                        message: `${attendee.name} has already been marked as attended`,
                        attendee: {
                            name: attendee.name,
                            email: attendee.email,
                            college: attendee.college,
                            department: attendee.department
                        },
                        ticket: {
                            ticketId: ticket.ticketId,
                            eventName: ticket.eventName
                        },
                        previousScans: await AttendanceLog.countDocuments({ 
                            ticketId: ticket.ticketId 
                        })
                    });
                }

                // Mark as attended
                await Attendee.findByIdAndUpdate(attendee._id, {
                    status: 'attended'
                });

                // Mark ticket as verified
                await Ticket.findByIdAndUpdate(ticket._id, {
                    isVerified: true,
                    verifiedAt: new Date(),
                    verifiedBy: scannerOperator || 'QR Scanner'
                });

                // Log successful attendance
                await AttendanceLog.create({
                    ticketId: ticket.ticketId,
                    attendeeId: attendee._id,
                    attendeeName: attendee.name,
                    attendeeEmail: attendee.email,
                    scanLocation: scanLocation || 'Event Entrance',
                    scannerOperator: scannerOperator || 'QR Scanner',
                    scanResult: 'success',
                    notes: notes || 'Successfully marked as attended',
                    ipAddress,
                    userAgent
                });

                return res.status(200).json({
                    success: true,
                    message: `Welcome ${attendee.name}! Attendance marked successfully.`,
                    attendee: {
                        name: attendee.name,
                        email: attendee.email,
                        phone: attendee.phone,
                        college: attendee.college,
                        department: attendee.department,
                        year: attendee.year
                    },
                    ticket: {
                        ticketId: ticket.ticketId,
                        eventName: ticket.eventName,
                        eventDate: ticket.eventDate,
                        eventTime: ticket.eventTime,
                        eventVenue: ticket.eventVenue
                    },
                    attendance: {
                        markedAt: new Date(),
                        scanLocation: scanLocation || 'Event Entrance',
                        scannerOperator: scannerOperator || 'QR Scanner'
                    }
                });

            } catch (parseError) {
                console.error('QR parsing error:', parseError);
                
                // Log invalid QR code
                await AttendanceLog.create({
                    ticketId: 'INVALID',
                    attendeeId: null,
                    attendeeName: 'Unknown',
                    attendeeEmail: 'unknown@invalid.com',
                    scanLocation: scanLocation || 'Event Entrance',
                    scannerOperator: scannerOperator || 'QR Scanner',
                    scanResult: 'invalid',
                    notes: `Invalid QR format: ${parseError.message}`,
                    ipAddress,
                    userAgent
                });

                return res.status(400).json({
                    success: false,
                    error: 'Invalid QR code format',
                    message: parseError.message
                });
            }
        }

        // Method not allowed
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            allowedMethods: ['GET', 'POST', 'OPTIONS']
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};