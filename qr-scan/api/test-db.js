// Quick test for database connection
import connectToDatabase from './database.js';

async function testConnection() {
    try {
        console.log('Testing database connection...');
        await connectToDatabase();
        console.log('✅ Database connection successful!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();