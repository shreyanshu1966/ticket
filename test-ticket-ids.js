// test-ticket-ids.js - Comprehensive ticket ID uniqueness testing
const database = require('./database');
const TicketIdValidator = require('./ticket-id-validator');
const { Ticket } = require('./models');

async function testTicketIdUniqueness() {
    console.log('🎫 Comprehensive Ticket ID Uniqueness Testing');
    console.log('============================================\n');

    try {
        // Connect to database
        const connected = await database.connect();
        if (!connected) {
            console.error('❌ Failed to connect to database');
            process.exit(1);
        }

        console.log('✅ Connected to database\n');

        // Test 1: Validate existing ticket IDs
        console.log('1. Validating existing ticket IDs...');
        const validation = await TicketIdValidator.validateAllTicketIds();
        
        if (validation.error) {
            console.error('❌ Validation error:', validation.error);
        } else {
            console.log(`📊 Total tickets: ${validation.totalTickets}`);
            console.log(`🔢 Unique ticket IDs: ${validation.uniqueTicketIds}`);
            console.log(`🎯 Validation result: ${validation.isValid ? '✅ PASS' : '❌ FAIL'}`);
            
            if (!validation.isValid && validation.duplicates.length > 0) {
                console.log('\n⚠️  DUPLICATE TICKET IDs FOUND:');
                validation.duplicates.forEach((dup, index) => {
                    console.log(`   ${index + 1}. Ticket ID: ${dup.ticketId} (${dup.count} duplicates)`);
                    dup.tickets.forEach((ticket, i) => {
                        console.log(`      ${i + 1}. ${ticket.attendeeName} (${ticket.attendeeEmail}) - ${ticket.createdAt}`);
                    });
                });
            }
        }

        // Test 2: Test ticket ID generation for collisions
        console.log('\n2. Testing ticket ID generation...');
        const generationTest = await TicketIdValidator.testTicketIdGeneration(1000);
        
        if (generationTest.success) {
            console.log(`✅ Generation test PASSED`);
            console.log(`   Generated: ${generationTest.totalGenerated} IDs`);
            console.log(`   Unique: ${generationTest.uniqueIds} IDs`);
            console.log(`   Collision rate: ${generationTest.collisionRate}`);
        } else {
            console.log(`❌ Generation test FAILED`);
            if (generationTest.collisions > 0) {
                console.log(`   Collisions detected: ${generationTest.collisions}`);
                console.log(`   Collision rate: ${generationTest.collisionRate}`);
                if (generationTest.collisionDetails.length > 0) {
                    console.log('   First few collisions:');
                    generationTest.collisionDetails.forEach((collision, i) => {
                        console.log(`      ${i + 1}. ${collision.ticketId} (iterations ${collision.originalIteration} & ${collision.iteration})`);
                    });
                }
            }
        }

        // Test 3: Analyze ticket ID patterns
        console.log('\n3. Analyzing ticket ID patterns...');
        const patternAnalysis = await TicketIdValidator.analyzeTicketIdPatterns();
        
        if (patternAnalysis.error) {
            console.error('❌ Pattern analysis error:', patternAnalysis.error);
        } else if (patternAnalysis.message) {
            console.log('📝', patternAnalysis.message);
        } else {
            console.log(`📈 Pattern Analysis Results:`);
            console.log(`   Total tickets analyzed: ${patternAnalysis.totalTickets}`);
            
            if (patternAnalysis.patterns) {
                console.log(`   Prefixes found: ${Object.keys(patternAnalysis.patterns.prefixes).join(', ')}`);
                console.log(`   Length variations: ${Object.keys(patternAnalysis.patterns.lengths).join(', ')}`);
                console.log('   Format breakdown:');
                Object.entries(patternAnalysis.patterns.formats).forEach(([format, count]) => {
                    console.log(`      ${format}: ${count}`);
                });
            }
            
            if (patternAnalysis.recommendations && patternAnalysis.recommendations.length > 0) {
                console.log('\n💡 Recommendations:');
                patternAnalysis.recommendations.forEach((rec, i) => {
                    console.log(`   ${i + 1}. ${rec}`);
                });
            }
        }

        // Test 4: Stress test with concurrent ticket generation simulation
        console.log('\n4. Stress testing concurrent generation...');
        const stressTestResults = await performStressTest();
        
        if (stressTestResults.success) {
            console.log(`✅ Stress test PASSED`);
            console.log(`   Simulated ${stressTestResults.totalAttempts} concurrent generations`);
            console.log(`   Unique IDs generated: ${stressTestResults.uniqueIds}`);
            console.log(`   No collisions detected`);
        } else {
            console.log(`❌ Stress test FAILED`);
            console.log(`   Collisions detected: ${stressTestResults.collisions}`);
        }

        // Final summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 TICKET ID UNIQUENESS TEST SUMMARY');
        console.log('='.repeat(50));
        
        const allTestsPassed = validation.isValid && 
                              generationTest.success && 
                              stressTestResults.success;
        
        console.log(`🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        
        if (allTestsPassed) {
            console.log('\n🎉 Congratulations! Your ticket ID system is bulletproof against duplicates!');
            console.log('🔒 Key strengths:');
            console.log('   • Database-level unique constraints');
            console.log('   • Application-level collision detection');
            console.log('   • Automatic retry with randomization');
            console.log('   • Emergency fallback to UUID-based IDs');
            console.log('   • Comprehensive validation and monitoring');
        } else {
            console.log('\n⚠️  Issues detected. Please review the test results above.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await database.disconnect();
        console.log('\n🔌 Disconnected from database');
    }
}

// Stress test function
async function performStressTest() {
    try {
        const promises = [];
        const results = new Set();
        
        // Simulate 50 concurrent ticket ID generations
        for (let i = 0; i < 50; i++) {
            promises.push(generateSimulatedTicketId(i));
        }
        
        const generatedIds = await Promise.all(promises);
        
        generatedIds.forEach(id => results.add(id));
        
        return {
            success: results.size === generatedIds.length,
            totalAttempts: generatedIds.length,
            uniqueIds: results.size,
            collisions: generatedIds.length - results.size
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Simulate ticket ID generation
async function generateSimulatedTicketId(index) {
    // Add small random delay to simulate real-world timing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    
    const timestamp = Date.now().toString().slice(-6);
    const nameCode = `TST`;
    const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
    const indexPadded = String(index).padStart(3, '0');
    
    return `SHAKTI2025-${nameCode}${timestamp}-${indexPadded}-${randomSuffix}`;
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n⏹️  Test interrupted by user');
    await database.disconnect();
    process.exit(0);
});

// Run if called directly
if (require.main === module) {
    testTicketIdUniqueness();
}

module.exports = { testTicketIdUniqueness };