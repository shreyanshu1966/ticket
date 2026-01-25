import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Registration from './models/Registration.js';
import connectDB from './config/database.js';

dotenv.config();

const checkRegistration = async () => {
  try {
    await connectDB();

    const registrationId = '6973d2cbe39de745fe86fa35';
    // Note: The ID provided in the error message "6973d2cbe39de745fe86fa35" looks like a valid ObjectID.
    
    // However, typical Mongo ObjectIDs are 24 hex characters. 
    // 6973d2cbe39de745fe86fa35 is 24 chars. 
    // Let's verify.
    
    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
        console.log(`ID ${registrationId} is not a valid ObjectId`);
        // It might be possible the log message cut it off or something, but let's try.
    }

    const registration = await Registration.findById(registrationId);

    if (registration) {
      console.log('Registration found:');
      console.log(JSON.stringify(registration, null, 2));
      console.log('totalAmount:', registration.totalAmount);
    } else {
      console.log('Registration not found.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkRegistration();
