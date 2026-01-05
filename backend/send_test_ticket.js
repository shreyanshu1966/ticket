import dotenv from 'dotenv';
import { sendConfirmationEmail } from './services/emailService.js';
import mongoose from 'mongoose';

// Load env vars
dotenv.config();

const testTicket = async () => {
    console.log('🚀 Starting Test Ticket Script...');

    const mockRegistrationData = {
        _id: new mongoose.Types.ObjectId(), // Generate a random real Mongo ID
        name: "Test User",
        email: "maskewebsol@gmail.com",
        college: "Test Engineering College",
        year: "3rd Year",
        amount: 500,
        createdAt: new Date()
    };

    console.log(`📧 Sending test ticket to: ${mockRegistrationData.email}`);

    try {
        const result = await sendConfirmationEmail(mockRegistrationData);
        if (result.success) {
            console.log('✅ Ticket sent successfully!');
            console.log('Message ID:', result.messageId);
        } else {
            console.error('❌ Failed to send ticket:', result.error);
        }
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
};

testTicket();
