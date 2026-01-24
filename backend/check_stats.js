import mongoose from 'mongoose';
import Registration from './models/Registration.js';

async function checkStats() {
  try {
    await mongoose.connect('mongodb://localhost:27017/eventregistration');
    console.log('Connected to MongoDB');

    const totalCount = await Registration.countDocuments();
    console.log('\n=== DATABASE STATS ===');
    console.log('Total documents:', totalCount);

    const completedCount = await Registration.countDocuments({ 
      paymentStatus: { $in: ['completed', 'verified'] } 
    });
    console.log('Completed payments:', completedCount);

    const pendingCount = await Registration.countDocuments({ 
      paymentStatus: 'pending'
    });
    console.log('Pending payments:', pendingCount);

    // Count total tickets
    const ticketStats = await Registration.aggregate([
      {
        $match: {
          paymentStatus: { $in: ['completed', 'verified'] }
        }
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: '$ticketQuantity' }
        }
      }
    ]);
    console.log('Total tickets (completed/verified):', ticketStats.length > 0 ? ticketStats[0].totalTickets : 0);

    // Sample records
    const samples = await Registration.find().limit(3).select('name email paymentStatus ticketQuantity isGroupBooking totalAmount');
    console.log('\n=== SAMPLE RECORDS ===');
    samples.forEach((record, i) => {
      console.log(`\nRecord ${i + 1}:`, {
        name: record.name,
        email: record.email,
        paymentStatus: record.paymentStatus,
        ticketQuantity: record.ticketQuantity,
        isGroupBooking: record.isGroupBooking,
        totalAmount: record.totalAmount
      });
    });

    // Count registrations the way the API does
    const totalRegistrationsStats = await Registration.aggregate([
      {
        $group: {
          _id: null,
          individualRegistrations: {
            $sum: {
              $cond: [{ $eq: ['$isGroupBooking', false] }, 1, 0]
            }
          },
          groupLeaders: {
            $sum: {
              $cond: [{ $eq: ['$isGroupBooking', true] }, 1, 0]
            }
          },
          groupMembers: {
            $sum: {
              $cond: [
                { $eq: ['$isGroupBooking', true] },
                { $size: { $ifNull: ['$groupMembers', []] } },
                0
              ]
            }
          }
        }
      }
    ]);

    console.log('\n=== REGISTRATION AGGREGATION ===');
    if (totalRegistrationsStats.length > 0) {
      console.log('Individual registrations:', totalRegistrationsStats[0].individualRegistrations);
      console.log('Group leaders:', totalRegistrationsStats[0].groupLeaders);
      console.log('Group members:', totalRegistrationsStats[0].groupMembers);
      console.log('Total:', totalRegistrationsStats[0].individualRegistrations + totalRegistrationsStats[0].groupLeaders + totalRegistrationsStats[0].groupMembers);
    } else {
      console.log('No aggregation results');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStats();
