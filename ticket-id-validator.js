// ticket-id-validator.js - Comprehensive ticket ID uniqueness validation
const { Ticket } = require('./models');
const database = require('./database');
const config = require('./config');

class TicketIdValidator {
    /**
     * Check for duplicate ticket IDs across the entire database
     * @returns {Object} Validation results
     */
    static async validateAllTicketIds() {
        try {
            console.log('🔍 Validating all ticket IDs for uniqueness...');
            
            // Get all tickets
            const allTickets = await Ticket.find({}).sort({ createdAt: 1 });
            console.log(`📊 Total tickets to validate: ${allTickets.length}`);
            
            if (allTickets.length === 0) {
                return {
                    isValid: true,
                    totalTickets: 0,
                    duplicates: [],
                    message: 'No tickets found in database'
                };
            }
            
            // Check for duplicates
            const ticketIdCounts = {};
            const duplicates = [];
            
            for (const ticket of allTickets) {
                const ticketId = ticket.ticketId;
                
                if (ticketIdCounts[ticketId]) {
                    ticketIdCounts[ticketId].count++;
                    ticketIdCounts[ticketId].tickets.push({
                        id: ticket._id,
                        attendeeName: ticket.attendeeName,
                        attendeeEmail: ticket.attendeeEmail,
                        createdAt: ticket.createdAt,
                        emailSent: ticket.emailSent
                    });
                } else {
                    ticketIdCounts[ticketId] = {
                        count: 1,
                        tickets: [{
                            id: ticket._id,
                            attendeeName: ticket.attendeeName,
                            attendeeEmail: ticket.attendeeEmail,
                            createdAt: ticket.createdAt,
                            emailSent: ticket.emailSent
                        }]
                    };
                }
            }
            
            // Find duplicates
            for (const [ticketId, data] of Object.entries(ticketIdCounts)) {
                if (data.count > 1) {
                    duplicates.push({
                        ticketId,
                        count: data.count,
                        tickets: data.tickets
                    });
                }
            }
            
            const isValid = duplicates.length === 0;
            
            return {
                isValid,
                totalTickets: allTickets.length,
                uniqueTicketIds: Object.keys(ticketIdCounts).length,
                duplicates,
                summary: {
                    totalTickets: allTickets.length,
                    uniqueIds: Object.keys(ticketIdCounts).length,
                    duplicateIds: duplicates.length,
                    duplicateTickets: duplicates.reduce((sum, dup) => sum + dup.count, 0)
                }
            };
            
        } catch (error) {
            console.error('❌ Error validating ticket IDs:', error.message);
            return {
                isValid: false,
                error: error.message,
                totalTickets: 0,
                duplicates: []
            };
        }
    }
    
    /**
     * Check if a specific ticket ID exists
     * @param {string} ticketId - The ticket ID to check
     * @returns {Object} Check results
     */
    static async checkTicketIdExists(ticketId) {
        try {
            const existingTickets = await Ticket.find({ ticketId }).sort({ createdAt: 1 });
            
            return {
                exists: existingTickets.length > 0,
                count: existingTickets.length,
                tickets: existingTickets.map(ticket => ({
                    id: ticket._id,
                    attendeeName: ticket.attendeeName,
                    attendeeEmail: ticket.attendeeEmail,
                    createdAt: ticket.createdAt,
                    emailSent: ticket.emailSent
                }))
            };
        } catch (error) {
            console.error('❌ Error checking ticket ID:', error.message);
            return {
                exists: false,
                count: 0,
                tickets: [],
                error: error.message
            };
        }
    }
    
    /**
     * Generate a comprehensive report on ticket ID patterns
     * @returns {Object} Pattern analysis report
     */
    static async analyzeTicketIdPatterns() {
        try {
            console.log('📈 Analyzing ticket ID patterns...');
            
            const allTickets = await Ticket.find({}).sort({ createdAt: 1 });
            
            if (allTickets.length === 0) {
                return { message: 'No tickets found for analysis' };
            }
            
            const patterns = {
                prefixes: {},
                lengths: {},
                formats: {
                    withPrefix: 0,
                    withTimestamp: 0,
                    withNameCode: 0,
                    withRandomSuffix: 0,
                    emergency: 0
                }
            };
            
            for (const ticket of allTickets) {
                const ticketId = ticket.ticketId;
                
                // Analyze prefix
                const prefix = ticketId.split('-')[0];
                patterns.prefixes[prefix] = (patterns.prefixes[prefix] || 0) + 1;
                
                // Analyze length
                const length = ticketId.length;
                patterns.lengths[length] = (patterns.lengths[length] || 0) + 1;
                
                // Analyze format
                if (ticketId.includes(config.qr.ticketPrefix)) {
                    patterns.formats.withPrefix++;
                }
                if (ticketId.includes('EMERGENCY')) {
                    patterns.formats.emergency++;
                }
                if (/\d{6}/.test(ticketId)) {
                    patterns.formats.withTimestamp++;
                }
                if (/[A-Z]{3}\d{6}/.test(ticketId)) {
                    patterns.formats.withNameCode++;
                }
                if (ticketId.split('-').length >= 4) {
                    patterns.formats.withRandomSuffix++;
                }
            }
            
            return {
                totalTickets: allTickets.length,
                patterns,
                recommendations: this.generateRecommendations(patterns, allTickets.length)
            };
            
        } catch (error) {
            console.error('❌ Error analyzing patterns:', error.message);
            return { error: error.message };
        }
    }
    
    /**
     * Generate recommendations based on pattern analysis
     * @private
     */
    static generateRecommendations(patterns, totalTickets) {
        const recommendations = [];
        
        if (patterns.formats.emergency > 0) {
            recommendations.push(`⚠️  Found ${patterns.formats.emergency} emergency ticket IDs - consider investigating collision causes`);
        }
        
        if (Object.keys(patterns.prefixes).length > 1) {
            recommendations.push(`💡 Multiple prefixes detected: ${Object.keys(patterns.prefixes).join(', ')}`);
        }
        
        if (patterns.formats.withRandomSuffix < totalTickets * 0.9) {
            recommendations.push(`🔧 Consider using random suffixes for all ticket IDs to improve uniqueness`);
        }
        
        const lengthVariation = Math.max(...Object.keys(patterns.lengths)) - Math.min(...Object.keys(patterns.lengths));
        if (lengthVariation > 5) {
            recommendations.push(`📏 High length variation (${lengthVariation}) - consider standardizing format`);
        }
        
        return recommendations;
    }
    
    /**
     * Test ticket ID generation for collisions
     * @param {number} iterations - Number of IDs to generate and test
     * @returns {Object} Test results
     */
    static async testTicketIdGeneration(iterations = 1000) {
        try {
            console.log(`🧪 Testing ticket ID generation for collisions (${iterations} iterations)...`);
            
            const testIds = new Set();
            const collisions = [];
            
            for (let i = 0; i < iterations; i++) {
                // Simulate ticket ID generation
                const timestamp = Date.now().toString().slice(-6);
                const nameCode = `TST`; // Test name code
                const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
                const indexPadded = String(i).padStart(3, '0');
                
                const ticketId = `${config.qr.ticketPrefix}-${nameCode}${timestamp}-${indexPadded}-${randomSuffix}`;
                
                if (testIds.has(ticketId)) {
                    collisions.push({
                        iteration: i,
                        ticketId,
                        originalIteration: Array.from(testIds).indexOf(ticketId)
                    });
                } else {
                    testIds.add(ticketId);
                }
                
                // Small delay every 100 iterations to change timestamp
                if (i % 100 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }
            
            return {
                totalGenerated: iterations,
                uniqueIds: testIds.size,
                collisions: collisions.length,
                collisionRate: (collisions.length / iterations * 100).toFixed(4) + '%',
                collisionDetails: collisions.slice(0, 10), // Show first 10 collisions
                success: collisions.length === 0
            };
            
        } catch (error) {
            console.error('❌ Error testing ID generation:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = TicketIdValidator;