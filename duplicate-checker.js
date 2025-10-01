// duplicate-checker.js - Utility to check and handle duplicates
const { Attendee, Ticket } = require('./models');
const TicketIdValidator = require('./ticket-id-validator');

class DuplicateChecker {
    /**
     * Check for duplicate attendees by email
     * @returns {Array} List of duplicate emails
     */
    static async findDuplicateAttendees() {
        try {
            const duplicates = await Attendee.aggregate([
                {
                    $group: {
                        _id: "$email",
                        count: { $sum: 1 },
                        docs: { $push: "$$ROOT" }
                    }
                },
                {
                    $match: {
                        count: { $gt: 1 }
                    }
                }
            ]);

            return duplicates.map(dup => ({
                email: dup._id,
                count: dup.count,
                attendees: dup.docs.map(doc => ({
                    id: doc._id,
                    name: doc.name,
                    registrationDate: doc.registrationDate
                }))
            }));
        } catch (error) {
            console.error('Error finding duplicate attendees:', error.message);
            return [];
        }
    }

    /**
     * Check for duplicate tickets
     * @returns {Array} List of duplicate ticket IDs
     */
    static async findDuplicateTickets() {
        try {
            const duplicateTicketIds = await Ticket.aggregate([
                {
                    $group: {
                        _id: "$ticketId",
                        count: { $sum: 1 },
                        docs: { $push: "$$ROOT" }
                    }
                },
                {
                    $match: {
                        count: { $gt: 1 }
                    }
                }
            ]);

            const duplicateAttendeeIds = await Ticket.aggregate([
                {
                    $group: {
                        _id: "$attendeeId",
                        count: { $sum: 1 },
                        docs: { $push: "$$ROOT" }
                    }
                },
                {
                    $match: {
                        count: { $gt: 1 }
                    }
                }
            ]);

            return {
                duplicateTicketIds: duplicateTicketIds.map(dup => ({
                    ticketId: dup._id,
                    count: dup.count,
                    tickets: dup.docs
                })),
                duplicateAttendeeIds: duplicateAttendeeIds.map(dup => ({
                    attendeeId: dup._id,
                    count: dup.count,
                    tickets: dup.docs.map(doc => ({
                        id: doc._id,
                        ticketId: doc.ticketId,
                        emailSent: doc.emailSent
                    }))
                }))
            };
        } catch (error) {
            console.error('Error finding duplicate tickets:', error.message);
            return { duplicateTicketIds: [], duplicateAttendeeIds: [] };
        }
    }

    /**
     * Get attendees without tickets
     * @returns {Array} Attendees who don't have tickets
     */
    static async getAttendeesWithoutTickets() {
        try {
            const attendeesWithTickets = await Ticket.distinct('attendeeId');
            const attendeesWithoutTickets = await Attendee.find({
                _id: { $nin: attendeesWithTickets }
            });

            return attendeesWithoutTickets;
        } catch (error) {
            console.error('Error finding attendees without tickets:', error.message);
            return [];
        }
    }

    /**
     * Get complete integrity report with enhanced ticket ID validation
     * @returns {Object} Comprehensive data integrity report
     */
    static async getIntegrityReport() {
        try {
            const [
                duplicateAttendees,
                duplicateTickets,
                attendeesWithoutTickets,
                totalAttendees,
                totalTickets,
                emailsSent,
                emailsFailed,
                ticketIdValidation
            ] = await Promise.all([
                this.findDuplicateAttendees(),
                this.findDuplicateTickets(),
                this.getAttendeesWithoutTickets(),
                Attendee.countDocuments(),
                Ticket.countDocuments(),
                Ticket.countDocuments({ emailSent: true }),
                Ticket.countDocuments({ emailSent: false, emailAttempts: { $gt: 0 } }),
                TicketIdValidator.validateAllTicketIds()
            ]);

            return {
                summary: {
                    totalAttendees,
                    totalTickets,
                    emailsSent,
                    emailsFailed,
                    attendeesWithoutTickets: attendeesWithoutTickets.length,
                    duplicateAttendees: duplicateAttendees.length,
                    duplicateTicketIds: duplicateTickets.duplicateTicketIds.length,
                    duplicateAttendeeTickets: duplicateTickets.duplicateAttendeeIds.length,
                    ticketIdValidation: {
                        isValid: ticketIdValidation.isValid,
                        uniqueTicketIds: ticketIdValidation.uniqueTicketIds || 0,
                        duplicateTicketIds: ticketIdValidation.duplicates?.length || 0
                    }
                },
                details: {
                    duplicateAttendees,
                    duplicateTickets,
                    attendeesWithoutTickets: attendeesWithoutTickets.map(att => ({
                        id: att._id,
                        name: att.name,
                        email: att.email,
                        status: att.status
                    })),
                    ticketIdValidation
                },
                isValid: duplicateAttendees.length === 0 && 
                        duplicateTickets.duplicateTicketIds.length === 0 && 
                        duplicateTickets.duplicateAttendeeIds.length === 0 &&
                        ticketIdValidation.isValid
            };
        } catch (error) {
            console.error('Error generating integrity report:', error.message);
            return {
                summary: {},
                details: {},
                isValid: false,
                error: error.message
            };
        }
    }

    /**
     * Clean up duplicate attendees (keep the first one)
     * @returns {Object} Cleanup results
     */
    static async cleanupDuplicateAttendees() {
        try {
            const duplicates = await this.findDuplicateAttendees();
            let cleaned = 0;

            for (const duplicate of duplicates) {
                // Keep the first attendee (oldest registration)
                const attendeesToRemove = duplicate.attendees.slice(1);
                
                for (const attendee of attendeesToRemove) {
                    // Remove tickets for duplicate attendees
                    await Ticket.deleteMany({ attendeeId: attendee.id });
                    // Remove duplicate attendee
                    await Attendee.deleteOne({ _id: attendee.id });
                    cleaned++;
                    console.log(`🗑️  Removed duplicate attendee: ${attendee.name} (${duplicate.email})`);
                }
            }

            return {
                success: true,
                cleaned,
                message: `Cleaned up ${cleaned} duplicate attendees`
            };
        } catch (error) {
            console.error('Error cleaning duplicate attendees:', error.message);
            return {
                success: false,
                cleaned: 0,
                error: error.message
            };
        }
    }
}

module.exports = DuplicateChecker;