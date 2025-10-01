// models.js - Mongoose schemas and models
const mongoose = require('mongoose');

// Attendee Schema
const attendeeSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,  // Ensure unique emails
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
                // Allow empty phone numbers or valid phone formats
                if (!phone || phone === '') return true;
                // Allow digits, spaces, hyphens, parentheses, and plus sign
                // Must be 7-15 digits after removing non-digits
                const digitsOnly = phone.replace(/[^\d]/g, '');
                return digitsOnly.length >= 7 && digitsOnly.length <= 15;
            },
            message: 'Invalid phone number format (must be 7-15 digits)'
        }
    },
    
    // Event Registration Info
    registrationDate: {
        type: Date,
        default: Date.now
    },
    registrationId: {
        type: String,
        unique: true,
        sparse: true
    },
    
    // College/Organization Info
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
    
    // Additional Fields (from CSV)
    additionalData: {
        type: Map,
        of: String,
        default: new Map()
    },
    
    // Status
    status: {
        type: String,
        enum: ['registered', 'ticket_sent', 'attended', 'cancelled'],
        default: 'registered'
    }
}, {
    timestamps: true,
    collection: 'attendees'
});

// Ticket Schema
const ticketSchema = new mongoose.Schema({
    // Ticket Information
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
    
    // Attendee Reference - Ensure one ticket per attendee
    attendeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendee',
        required: true,
        unique: true  // Ensure one ticket per attendee
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
    
    // Event Information
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
    
    // Email Status
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
    
    // Verification Status
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
    
    // Additional metadata
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
});

// Email Log Schema
const emailLogSchema = new mongoose.Schema({
    // Email Details
    to: {
        type: String,
        required: true,
        lowercase: true
    },
    subject: {
        type: String,
        required: true
    },
    ticketId: {
        type: String,
        required: true
    },
    
    // References
    attendeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendee'
    },
    ticketObjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    },
    
    // Status
    status: {
        type: String,
        enum: ['sent', 'failed', 'bounced', 'delivered'],
        required: true
    },
    
    // Error Information
    error: {
        message: String,
        code: String,
        stack: String
    },
    
    // Email Provider Response
    messageId: {
        type: String
    },
    response: {
        type: String
    },
    
    // Timing
    sentAt: {
        type: Date,
        default: Date.now
    },
    deliveredAt: {
        type: Date
    },
    
    // Retry Information
    attempts: {
        type: Number,
        default: 1
    },
    lastAttemptAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'email_logs'
});

// Event Statistics Schema
const eventStatsSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true,
        default: 'SHAKTI'
    },
    
    // Counts
    totalRegistrations: {
        type: Number,
        default: 0
    },
    totalTicketsSent: {
        type: Number,
        default: 0
    },
    totalEmailsSent: {
        type: Number,
        default: 0
    },
    totalEmailsFailed: {
        type: Number,
        default: 0
    },
    totalAttendees: {
        type: Number,
        default: 0
    },
    
    // Last Updated
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    
    // Breakdown by status
    statusBreakdown: {
        registered: { type: Number, default: 0 },
        ticket_sent: { type: Number, default: 0 },
        attended: { type: Number, default: 0 },
        cancelled: { type: Number, default: 0 }
    }
}, {
    timestamps: true,
    collection: 'event_stats'
});

// Indexes for better performance (only for non-unique fields)
attendeeSchema.index({ status: 1 });
attendeeSchema.index({ registrationDate: -1 });

ticketSchema.index({ attendeeEmail: 1 });
ticketSchema.index({ emailSent: 1 });
ticketSchema.index({ isVerified: 1 });

emailLogSchema.index({ to: 1 });
emailLogSchema.index({ ticketId: 1 });
emailLogSchema.index({ status: 1 });
emailLogSchema.index({ sentAt: -1 });

// Create models
const Attendee = mongoose.model('Attendee', attendeeSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);
const EmailLog = mongoose.model('EmailLog', emailLogSchema);
const EventStats = mongoose.model('EventStats', eventStatsSchema);

module.exports = {
    Attendee,
    Ticket,
    EmailLog,
    EventStats
};