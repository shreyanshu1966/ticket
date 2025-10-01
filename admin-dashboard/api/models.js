// api/models.js - Mongoose models for admin dashboard
import mongoose from 'mongoose';

// Check if models are already compiled to avoid re-compilation in serverless
const Attendee = mongoose.models.Attendee || mongoose.model('Attendee', new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'Invalid email format'
        }
    },
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function(phone) {
                if (!phone || phone === '') return true;
                const digitsOnly = phone.replace(/[^\d]/g, '');
                return digitsOnly.length >= 7 && digitsOnly.length <= 15;
            },
            message: 'Invalid phone number format (must be 7-15 digits)'
        }
    },
    college: {
        type: String,
        trim: true,
        maxlength: 200
    },
    department: {
        type: String,
        trim: true,
        maxlength: 100
    },
    year: {
        type: String,
        trim: true,
        maxlength: 50
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    registrationId: {
        type: String,
        unique: true,
        sparse: true
    },
    status: {
        type: String,
        enum: ['registered', 'ticket_sent', 'attended', 'cancelled'],
        default: 'registered'
    },
    additionalData: {
        type: Map,
        of: String,
        default: new Map()
    }
}, {
    timestamps: true,
    collection: 'attendees'
}));

const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    attendeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendee',
        required: true
    },
    eventName: {
        type: String,
        default: 'SHAKTI'
    },
    eventDate: {
        type: String,
        default: '2025-10-15'
    },
    venue: {
        type: String,
        default: 'MIT Academy of Engineering, Alandi'
    },
    organizer: {
        type: String,
        default: 'ACES MIT ADT'
    },
    qrCodeData: {
        type: String,
        required: true
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'tickets'
}));

const AttendanceLog = mongoose.models.AttendanceLog || mongoose.model('AttendanceLog', new mongoose.Schema({
    attendeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendee',
        required: true
    },
    ticketId: {
        type: String,
        required: true,
        uppercase: true
    },
    scanTime: {
        type: Date,
        default: Date.now
    },
    scanType: {
        type: String,
        enum: ['check-in', 'check-out', 'scan'],
        default: 'check-in'
    },
    location: {
        type: String,
        default: 'Main Entrance'
    },
    scannedBy: {
        type: String,
        default: 'System'
    },
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    }
}, {
    timestamps: true,
    collection: 'attendance_logs'
}));

export { Attendee, Ticket, AttendanceLog };