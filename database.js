// database.js - MongoDB connection and utilities
const mongoose = require('mongoose');
const config = require('./config');

class Database {
    constructor() {
        this.connection = null;
        this.isConnected = false;
    }

    /**
     * Connect to MongoDB database
     * @returns {Promise<boolean>} Success status
     */
    async connect() {
        try {
            console.log('🔗 Connecting to MongoDB...');
            console.log(`📍 Database URI: ${config.database.uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
            
            this.connection = await mongoose.connect(config.database.uri, config.database.options);
            this.isConnected = true;
            
            console.log('✅ MongoDB connected successfully');
            console.log(`📊 Database: ${this.connection.connection.name}`);
            console.log(`🖥️  Host: ${this.connection.connection.host}:${this.connection.connection.port}`);
            
            // Handle connection events
            mongoose.connection.on('error', (error) => {
                console.error('❌ MongoDB connection error:', error.message);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                console.log('⚠️  MongoDB disconnected');
                this.isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                console.log('✅ MongoDB reconnected');
                this.isConnected = true;
            });

            return true;
        } catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Disconnect from MongoDB
     * @returns {Promise<boolean>} Success status
     */
    async disconnect() {
        try {
            if (this.connection) {
                await mongoose.disconnect();
                console.log('🔌 MongoDB disconnected gracefully');
                this.isConnected = false;
                return true;
            }
            return true;
        } catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error.message);
            return false;
        }
    }

    /**
     * Check if database is connected
     * @returns {boolean} Connection status
     */
    isHealthy() {
        return this.isConnected && mongoose.connection.readyState === 1;
    }

    /**
     * Get connection statistics
     * @returns {Object} Connection stats
     */
    getConnectionStats() {
        if (!this.isConnected) {
            return { status: 'disconnected' };
        }

        return {
            status: 'connected',
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name,
            collections: Object.keys(mongoose.connection.collections)
        };
    }

    /**
     * Clear all data from collections (use with caution)
     * @returns {Promise<boolean>} Success status
     */
    async clearAllData() {
        try {
            console.log('🗑️  Clearing all data from database...');
            const collections = mongoose.connection.collections;
            
            for (const key in collections) {
                const collection = collections[key];
                await collection.deleteMany({});
                console.log(`   Cleared collection: ${collection.collectionName}`);
            }
            
            console.log('✅ All data cleared successfully');
            return true;
        } catch (error) {
            console.error('❌ Error clearing database:', error.message);
            return false;
        }
    }
}

// Create singleton instance
const database = new Database();

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT. Closing database connection...');
    await database.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM. Closing database connection...');
    await database.disconnect();
    process.exit(0);
});

module.exports = database;