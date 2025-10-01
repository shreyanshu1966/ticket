// api/database.js - MongoDB connection for serverless functions
import mongoose from 'mongoose';

let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        console.log('Using existing database connection');
        return;
    }

    try {
        const mongoUri = process.env.MONGODB_URI;
        
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        console.log('Connecting to MongoDB...');
        
        // Serverless-optimized connection options
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 5, // Reduced for serverless
            bufferCommands: false,
            bufferMaxEntries: 0,
        };

        await mongoose.connect(mongoUri, options);
        
        isConnected = true;
        console.log('Connected to MongoDB successfully');
        
        // Handle connection events
        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            isConnected = false;
        });

    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
};

export default connectToDatabase;