import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventregistration'

async function fixTicketNumberIndex() {
    try {
        console.log('🔌 Connecting to MongoDB...')
        await mongoose.connect(MONGODB_URI)
        console.log('✅ Connected to MongoDB')

        const db = mongoose.connection.db
        const collection = db.collection('registrations')

        // Check existing indexes
        console.log('\n📋 Current indexes:')
        const indexes = await collection.indexes()
        indexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key), index.sparse ? '(sparse)' : '')
        })

        // Drop the old ticketNumber index if it exists
        try {
            console.log('\n🗑️  Dropping old ticketNumber_1 index...')
            await collection.dropIndex('ticketNumber_1')
            console.log('✅ Old index dropped')
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️  Index ticketNumber_1 does not exist, skipping...')
            } else {
                throw error
            }
        }

        // Create new sparse unique index
        console.log('\n🔨 Creating new sparse unique index on ticketNumber...')
        await collection.createIndex(
            { ticketNumber: 1 },
            { unique: true, sparse: true }
        )
        console.log('✅ New sparse index created')

        // Verify the new index
        console.log('\n📋 Updated indexes:')
        const newIndexes = await collection.indexes()
        newIndexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key), index.sparse ? '(sparse)' : '')
        })

        console.log('\n✅ Database index fixed successfully!')
        console.log('You can now create registrations with null ticketNumber values.')

    } catch (error) {
        console.error('❌ Error fixing index:', error)
    } finally {
        await mongoose.connection.close()
        console.log('\n🔌 Disconnected from MongoDB')
        process.exit(0)
    }
}

fixTicketNumberIndex()
