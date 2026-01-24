import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { sendConfirmationEmail, sendFriendOTPEmail, sendFriendRegistrationConfirmation } from './services/emailService.js';

// Load env vars
dotenv.config();

const TEST_EMAIL = 'shreyanshumaske1966@gmail.com';

const testAllEmails = async () => {
    console.log('🚀 Starting Comprehensive Email Test...\n');
    console.log(`📧 All emails will be sent to: ${TEST_EMAIL}\n`);

    // Test 1: Ticket/Registration Confirmation Email (using main transporter)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Test 1: Ticket Confirmation Email');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const mockRegistrationData = {
        _id: new mongoose.Types.ObjectId(),
        ticketNumber: 'TICKET' + Math.floor(Math.random() * 10000),
        name: "Shreyanshu Maske",
        email: TEST_EMAIL,
        phone: "9876543210",
        college: "Test Engineering College",
        year: "3rd Year",
        amount: 19900, // in paise
        paymentStatus: 'success',
        isGroupBooking: false,
        ticketQuantity: 1,
        createdAt: new Date()
    };

    try {
        console.log('Sending ticket email...');
        const ticketResult = await sendConfirmationEmail(mockRegistrationData);
        if (ticketResult.success) {
            console.log('✅ Ticket email sent successfully!');
            console.log('   Message ID:', ticketResult.messageId);
        } else {
            console.error('❌ Failed to send ticket email:', ticketResult.error);
        }
    } catch (error) {
        console.error('❌ Unexpected error in ticket email:', error.message);
    }

    console.log('\n');

    // Test 2: Friend OTP Email (using OTP transporter)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Test 2: Friend Referral OTP Email');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
        console.log('Sending OTP email...');
        console.log('OTP Code:', testOTP);
        const otpResult = await sendFriendOTPEmail(TEST_EMAIL, "Shreyanshu Maske", testOTP);
        if (otpResult.success) {
            console.log('✅ OTP email sent successfully!');
            console.log('   Message ID:', otpResult.messageId);
        } else {
            console.error('❌ Failed to send OTP email:', otpResult.error);
        }
    } catch (error) {
        console.error('❌ Unexpected error in OTP email:', error.message);
    }

    console.log('\n');

    // Test 3: Friend Registration Confirmation Email (using main transporter)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Test 3: Friend Registration Confirmation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        console.log('Sending friend registration confirmation...');
        const friendResult = await sendFriendRegistrationConfirmation(
            TEST_EMAIL,
            "Shreyanshu's Friend",
            "Shreyanshu Maske",
            10000 // ₹100 discount in paise
        );
        if (friendResult.success) {
            console.log('✅ Friend registration email sent successfully!');
            console.log('   Message ID:', friendResult.messageId);
        } else {
            console.error('❌ Failed to send friend registration email:', friendResult.error);
        }
    } catch (error) {
        console.error('❌ Unexpected error in friend registration email:', error.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Email Testing Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 Summary:');
    console.log('   • Ticket Email: Uses mail@acesmitadt.com');
    console.log('   • OTP Email: Uses no.reply@acesmitadt.com');
    console.log('   • Friend Confirmation: Uses mail@acesmitadt.com');
    console.log(`   • All emails sent to: ${TEST_EMAIL}\n`);
    
    console.log('💡 Check your inbox at shreyanshumaske1966@gmail.com\n');
};

// Run the test
testAllEmails().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
