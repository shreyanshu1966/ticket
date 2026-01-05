import dotenv from 'dotenv'
import Razorpay from 'razorpay'

// Load environment variables
dotenv.config()

console.log('\n🔍 Razorpay Configuration Check\n')
console.log('='.repeat(50))

// Check if credentials are set
const keyId = process.env.RAZORPAY_KEY_ID
const keySecret = process.env.RAZORPAY_KEY_SECRET

console.log('\n📋 Environment Variables:')
console.log(`RAZORPAY_KEY_ID: ${keyId ? '✅ Set (' + keyId.substring(0, 12) + '...)' : '❌ Not set'}`)
console.log(`RAZORPAY_KEY_SECRET: ${keySecret ? '✅ Set (' + keySecret.substring(0, 8) + '...)' : '❌ Not set'}`)

if (!keyId || !keySecret) {
    console.log('\n❌ ERROR: Razorpay credentials are not configured!')
    console.log('\n📝 To fix this:')
    console.log('1. Open backend/.env file')
    console.log('2. Add these lines:')
    console.log('   RAZORPAY_KEY_ID=your_key_id_here')
    console.log('   RAZORPAY_KEY_SECRET=your_key_secret_here')
    console.log('\n3. Get credentials from: https://dashboard.razorpay.com/app/keys')
    console.log('\n⚠️  For testing, use TEST mode keys (starting with rzp_test_)')
    process.exit(1)
}

// Check if using default/placeholder values
if (keyId === 'rzp_test_default' || keySecret === 'default_secret') {
    console.log('\n⚠️  WARNING: Using default placeholder credentials!')
    console.log('Please update with real Razorpay credentials.')
    process.exit(1)
}

// Test Razorpay connection
console.log('\n🔌 Testing Razorpay API Connection...')

try {
    const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    })

    // Try to create a test order
    const testOrder = await razorpay.orders.create({
        amount: 100, // ₹1 in paise
        currency: 'INR',
        receipt: `test_${Date.now()}`,
        notes: {
            test: 'Configuration check'
        }
    })

    console.log('✅ SUCCESS: Razorpay API is working!')
    console.log(`   Test Order ID: ${testOrder.id}`)
    console.log(`   Amount: ₹${testOrder.amount / 100}`)
    console.log(`   Currency: ${testOrder.currency}`)
    console.log(`   Status: ${testOrder.status}`)

    console.log('\n✨ Your Razorpay configuration is correct!')
    console.log('   You can now accept payments in your application.')

} catch (error) {
    console.log('\n❌ ERROR: Failed to connect to Razorpay API')
    console.log(`   Error: ${error.message}`)

    if (error.statusCode === 401 || error.statusCode === 400) {
        console.log('\n🔑 Authentication Error:')
        console.log('   Your Key ID and Key Secret do not match.')
        console.log('   Please verify your credentials at:')
        console.log('   https://dashboard.razorpay.com/app/keys')
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
        console.log('\n🌐 Network Error:')
        console.log('   Cannot reach api.razorpay.com')
        console.log('   Please check:')
        console.log('   - Internet connection')
        console.log('   - Firewall settings')
        console.log('   - VPN/Proxy configuration')
    } else {
        console.log('\n📋 Full Error Details:')
        console.log(error)
    }

    process.exit(1)
}

console.log('\n' + '='.repeat(50))
console.log('✅ All checks passed!\n')
