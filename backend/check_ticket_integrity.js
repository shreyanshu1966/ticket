import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Registration from './models/Registration.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env') })

async function checkTicketIntegrity() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('✅ Connected to MongoDB')

        // 1. Find completed payments without ticket numbers
        const noTicketNumber = await Registration.find({
            paymentStatus: 'completed',
            $or: [
                { ticketNumber: null },
                { ticketNumber: { $exists: false } }
            ]
        }).select('name email ticketGenerated emailSentAt')

        console.log('\n🔍 Registrations with completed payment but NO ticket number:')
        console.log(`Count: ${noTicketNumber.length}`)
        if (noTicketNumber.length > 0) {
            console.log('⚠️ CRITICAL ISSUE - These records need ticket numbers!')
            noTicketNumber.forEach(reg => {
                console.log(`  - ${reg.email} | ticketGenerated: ${reg.ticketGenerated} | emailSentAt: ${reg.emailSentAt}`)
            })
        }

        // 2. Find inconsistent state (ticketGenerated=true but no ticket number)
        const inconsistentState = await Registration.find({
            paymentStatus: 'completed',
            ticketGenerated: true,
            $or: [
                { ticketNumber: null },
                { ticketNumber: { $exists: false } }
            ]
        }).select('name email emailSentAt')

        console.log('\n🔍 Inconsistent state (ticketGenerated=true but no ticketNumber):')
        console.log(`Count: ${inconsistentState.length}`)
        if (inconsistentState.length > 0) {
            console.log('🚨 CRITICAL BUG - Resending will create new ticket numbers that won\'t be saved!')
            inconsistentState.forEach(reg => {
                console.log(`  - ${reg.email} | emailSentAt: ${reg.emailSentAt}`)
            })
        }

        // 3. Check for duplicate ticket numbers
        const duplicates = await Registration.aggregate([
            { $match: { ticketNumber: { $ne: null, $exists: true } } },
            { $group: { _id: '$ticketNumber', count: { $sum: 1 }, emails: { $push: '$email' } } },
            { $match: { count: { $gt: 1 } } }
        ])

        console.log('\n🔍 Duplicate ticket numbers:')
        console.log(`Count: ${duplicates.length}`)
        if (duplicates.length > 0) {
            console.log('⚠️ WARNING - Duplicate ticket numbers found!')
            duplicates.forEach(dup => {
                console.log(`  - Ticket: ${dup._id} | Count: ${dup.count} | Emails: ${dup.emails.join(', ')}`)
            })
        }

        // 4. Find tickets that were generated but never sent
        const generatedNotSent = await Registration.find({
            paymentStatus: 'completed',
            ticketGenerated: true,
            ticketNumber: { $ne: null, $exists: true },
            $or: [
                { emailSentAt: null },
                { emailSentAt: { $exists: false } }
            ]
        }).select('name email ticketNumber')

        console.log('\n🔍 Tickets generated but email not sent:')
        console.log(`Count: ${generatedNotSent.length}`)
        if (generatedNotSent.length > 0) {
            console.log('ℹ️ These users have ticket numbers but may not have received emails')
            generatedNotSent.forEach(reg => {
                console.log(`  - ${reg.email} | Ticket: ${reg.ticketNumber}`)
            })
        }

        // 5. Summary statistics
        const totalCompleted = await Registration.countDocuments({ paymentStatus: 'completed' })
        const withTickets = await Registration.countDocuments({
            paymentStatus: 'completed',
            ticketNumber: { $ne: null, $exists: true }
        })
        const withEmails = await Registration.countDocuments({
            paymentStatus: 'completed',
            emailSentAt: { $ne: null, $exists: true }
        })

        console.log('\n📊 Summary Statistics:')
        console.log(`Total completed payments: ${totalCompleted}`)
        console.log(`With ticket numbers: ${withTickets}`)
        console.log(`With email sent: ${withEmails}`)
        console.log(`Missing tickets: ${totalCompleted - withTickets}`)
        console.log(`Missing emails: ${totalCompleted - withEmails}`)

        // 6. Safety check for resend
        console.log('\n🎯 RESEND SAFETY CHECK:')
        if (inconsistentState.length > 0) {
            console.log('❌ UNSAFE TO RESEND - Fix inconsistent state first!')
            console.log('   Apply Fix #1 from RESEND_TICKET_ANALYSIS.md')
        } else if (noTicketNumber.length > 0) {
            console.log('⚠️ CAUTION - Some registrations need tickets')
            console.log('   These will get new ticket numbers (which is correct)')
        } else {
            console.log('✅ SAFE TO RESEND - All data is consistent')
        }

    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await mongoose.disconnect()
        console.log('\n✅ Disconnected from MongoDB')
    }
}

checkTicketIntegrity()
