import mongoose from 'mongoose'

const eventEntrySchema = new mongoose.Schema({
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  ticketNumber: {
    type: String,
    required: true,
    trim: true
  },
  attendeeName: {
    type: String,
    required: true,
    trim: true
  },
  attendeeEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  attendeeCollege: {
    type: String,
    trim: true
  },
  attendeeYear: {
    type: String,
    trim: true
  },
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 2,  // Can extend for more days in future
    validate: {
      validator: function(v) {
        return [1, 2].includes(v)
      },
      message: 'Day must be 1 or 2'
    }
  },
  entryDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  scannedAt: {
    type: Date,
    default: Date.now
  },
  isGroupMember: {
    type: Boolean,
    default: false
  },
  groupMemberId: {
    type: String,
    trim: true
  },
  // Store booking email for group members (different from attendee email)
  bookingEmail: {
    type: String,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
})

// Ensure one entry per ticket per day
eventEntrySchema.index({ ticketNumber: 1, day: 1 }, { unique: true })

// Additional indexes for queries
eventEntrySchema.index({ registrationId: 1, day: 1 })
eventEntrySchema.index({ day: 1, entryDate: 1 })
eventEntrySchema.index({ attendeeEmail: 1 })

// Virtual for formatted entry date
eventEntrySchema.virtual('entryDateFormatted').get(function() {
  return this.entryDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium'
  })
})

// Instance method to check if this is a duplicate entry
eventEntrySchema.methods.isDuplicateEntry = async function() {
  const existing = await this.constructor.findOne({
    ticketNumber: this.ticketNumber,
    day: this.day,
    _id: { $ne: this._id }
  })
  return !!existing
}

// Static method to get daily stats
eventEntrySchema.statics.getDailyStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$day',
        totalEntries: { $sum: 1 },
        uniqueTickets: { $addToSet: '$ticketNumber' }
      }
    },
    {
      $project: {
        day: '$_id',
        totalEntries: 1,
        uniqueTickets: { $size: '$uniqueTickets' }
      }
    },
    {
      $sort: { day: 1 }
    }
  ])
  
  return stats
}

// Static method to get attendees who came both days
eventEntrySchema.statics.getBothDaysAttendees = async function() {
  const bothDays = await this.aggregate([
    {
      $group: {
        _id: '$ticketNumber',
        days: { $addToSet: '$day' },
        entries: { $push: '$$ROOT' }
      }
    },
    {
      $match: {
        days: { $size: 2 }
      }
    },
    {
      $project: {
        ticketNumber: '$_id',
        attendeeName: { $arrayElemAt: ['$entries.attendeeName', 0] },
        attendeeEmail: { $arrayElemAt: ['$entries.attendeeEmail', 0] },
        entries: 1
      }
    }
  ])
  
  return bothDays
}

const EventEntry = mongoose.model('EventEntry', eventEntrySchema)

export default EventEntry