// api/models.js - Mongoose models for serverless functions
const mongoose = require('mongoose');

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
    qrCodeData: {
        type: String,
        required: true
    },
    attendeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendee',
        required: true,
        unique: true
    },
    attendeeName: {
        type: String,
        required: true
    },
    attendeeEmail: {
        type: String,
        required: true,
        lowercase: true
    },
    eventName: {
        type: String,
        required: true,
        default: 'SHAKTI'
    },
    eventDate: {
        type: String,
        required: true
    },
    eventTime: {
        type: String,
        required: true
    },
    eventVenue: {
        type: String,
        required: true
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: {
        type: Date
    },
    emailError: {
        type: String
    },
    emailAttempts: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    },
    verifiedBy: {
        type: String
    },
    generatedBy: {
        type: String,
        default: 'system'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true,
    collection: 'tickets'
}));

const AttendanceLog = mongoose.models.AttendanceLog || mongoose.model('AttendanceLog', new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        uppercase: true
    },
    attendeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendee',
        required: true
    },
    attendeeName: {
        type: String,
        required: true
    },
    attendeeEmail: {
        type: String,
        required: true,
        lowercase: true
    },
    scanTime: {
        type: Date,
        default: Date.now
    },
    scanLocation: {
        type: String,
        default: 'Event Entrance'
    },
    scannerDeviceId: {
        type: String
    },
    scannerOperator: {
        type: String,
        default: 'QR Scanner'
    },
    scanResult: {
        type: String,
        enum: ['success', 'duplicate', 'invalid', 'expired'],
        required: true
    },
    notes: {
        type: String
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true,
    collection: 'attendance_logs'
}));

module.exports = {
    Attendee,
    Ticket,
    AttendanceLog
};