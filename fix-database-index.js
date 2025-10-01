// fix-database-index.js - Fix the ticketId index issue
const database = require('./database');
const { Attendee } = require('./models');

async function fixDatabaseIndex() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await database.connect();
        
        console.log('\n📊 CHECKING ATTENDEE COLLECTION INDEXES:');
        const indexes = await Attendee.collection.getIndexes();
        
        console.log('Current indexes:');
        for (const [indexName, indexSpec] of Object.entries(indexes)) {
            console.log(`   ${indexName}:`, indexSpec);
        }
        
        // Check if ticketId index exists and drop it
        if (indexes.ticketId_1) {
            console.log('\n🗑️  DROPPING PROBLEMATIC ticketId INDEX...');
            await Attendee.collection.dropIndex('ticketId_1');
            console.log('✅ Successfully dropped ticketId_1 index');
        } else {
            console.log('\n✅ No problematic ticketId index found');
        }
        
        console.log('\n📊 FINAL INDEXES:');
        const finalIndexes = await Attendee.collection.getIndexes();
        for (const [indexName, indexSpec] of Object.entries(finalIndexes)) {
            console.log(`   ${indexName}:`, indexSpec);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await database.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

fixDatabaseIndex();