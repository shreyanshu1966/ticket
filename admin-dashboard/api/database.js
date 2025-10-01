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
        
        // Serverless-optimized connection options for Mongoose 8.x
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 5,
            bufferCommands: false,
        };

        await mongoose.connect(mongoUri, options);
        
        isConnected = true;
        console.log('MongoDB connected successfully');
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

export { connectToDatabase };