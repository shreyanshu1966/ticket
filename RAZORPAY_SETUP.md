# Razorpay Setup Guide

## Error: "api.razorpay.com didn't send any data"

This error occurs when Razorpay API credentials are missing or invalid.

## Solution Steps

### 1. Get Razorpay Test Credentials

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up or log in
3. Go to **Settings** → **API Keys**
4. Click **Generate Test Key** (for testing)
5. You'll get:
   - **Key ID**: Starts with `rzp_test_`
   - **Key Secret**: A long alphanumeric string

### 2. Configure Backend (.env file)

Open `D:/ticket/backend/.env` and add/update these lines:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
```

**Important**: Replace `YOUR_KEY_ID_HERE` and `YOUR_KEY_SECRET_HERE` with your actual Razorpay credentials.

### 3. Configure Frontend (.env file)

Create or update `D:/ticket/.env` with:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
VITE_API_BASE_URL=http://localhost:5000
```

**Note**: Use the same Key ID in both frontend and backend.

### 4. Restart Servers

After updating the `.env` files:

1. **Stop both servers** (Ctrl+C in both terminals)
2. **Restart backend**: `cd backend && npm run dev`
3. **Restart frontend**: `npm run dev`

### 5. Verify Configuration

Test the setup:
1. Open browser console (F12)
2. Try registering
3. Check for any Razorpay errors

## Common Issues

### Issue 1: "Invalid key_id or key_secret"
- **Cause**: Credentials don't match
- **Fix**: Double-check both Key ID and Secret in Razorpay dashboard

### Issue 2: "api.razorpay.com didn't send any data"
- **Cause**: Missing credentials or network issue
- **Fix**: 
  - Verify `.env` file has correct credentials
  - Check if Razorpay API is accessible (try `ping api.razorpay.com`)
  - Disable VPN/Proxy if using

### Issue 3: Frontend shows wrong key
- **Cause**: Frontend not reading `.env` file
- **Fix**: 
  - Ensure `.env` is in root directory (`D:/ticket/.env`)
  - Restart Vite dev server
  - Clear browser cache

## Testing Payment Flow

### Test Mode (Free)
- Use test credentials (starting with `rzp_test_`)
- No real money is charged
- Use test card numbers from [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

### Test Card Details
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

## Production Setup

When going live:
1. Generate **Live Keys** from Razorpay dashboard
2. Complete KYC verification
3. Update `.env` with live credentials (starting with `rzp_live_`)
4. Test thoroughly before launch

## Security Notes

⚠️ **Never commit `.env` files to Git**
⚠️ **Never share your Key Secret publicly**
⚠️ **Use environment variables in production**

## Need Help?

If issues persist:
1. Check backend console for detailed error messages
2. Verify MongoDB is connected
3. Check network connectivity to Razorpay
4. Review Razorpay dashboard for API status
