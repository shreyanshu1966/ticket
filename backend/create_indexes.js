import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket-system'

async function createIndexes() {
    try {
        console.log('🔌 Connecting to MongoDB...')
        await mongoose.connect(MONGODB_URI)
        console.log('✅ Connected to MongoDB')

        const db = mongoose.connection.db
        const collection = db.collection('registrations')

        console.log('\n📋 Current indexes:')
        const existingIndexes = await collection.indexes()
        existingIndexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key))
        })

        console.log('\n🔨 Creating performance indexes...')

        // Helper function to create index safely
        const createIndexSafely = async (keys, options) => {
            try {
                await collection.createIndex(keys, options)
                console.log(`✅ Created index: ${options.name}`)
            } catch (error) {
                if (error.code === 86 || error.codeName === 'IndexKeySpecsConflict') {
                    console.log(`ℹ️  Index ${options.name} already exists, skipping...`)
                } else if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
                    console.log(`ℹ️  Index ${options.name} exists with different options, skipping...`)
                } else {
                    throw error
                }
            }
        }

        // Create compound indexes for common query patterns
        await createIndexSafely(
            { paymentStatus: 1, createdAt: -1 },
            { name: 'paymentStatus_createdAt', background: true }
        )

        await createIndexSafely(
            { year: 1, createdAt: -1 },
            { name: 'year_createdAt', background: true }
        )

        await createIndexSafely(
            { email: 1 },
            { name: 'email_1', background: true }
        )

        // Text index for search functionality
        await createIndexSafely(
            { name: 'text', email: 'text', college: 'text' },
            { name: 'search_text', background: true }
        )

        await createIndexSafely(
            { createdAt: -1 },
            { name: 'createdAt_-1', background: true }
        )

        console.log('\n📋 Updated indexes:')
        const newIndexes = await collection.indexes()
        newIndexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key))
        })

        console.log('\n✅ All performance indexes created successfully!')
        console.log('🚀 Your registration page should now load much faster!')

    } catch (error) {
        console.error('❌ Error creating indexes:', error)
        process.exit(1)
    } finally {
        await mongoose.connection.close()
        console.log('\n🔌 Database connection closed')
        process.exit(0)
    }
}

createIndexes()
