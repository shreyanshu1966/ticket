# 🚀 Quick Vercel Deployment Fix

## ✅ **Environment Variables Setup**

### **Step 1: Vercel Dashboard Setup**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your QR Scanner project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable Name | Value |
|---------------|-------|
| `MONGODB_URI` | `mongodb+srv://parliamentofaces2018_db_user:Aces2025@cluster0.5rlg3yz.mongodb.net/shakti_tickets?retryWrites=true&w=majority&appName=Cluster0` |
| `ADMIN_SECRET` | `shakti-admin-2025` |
| `NODE_ENV` | `production` |
| `EVENT_NAME` | `SHAKTI` |
| `EVENT_DATE` | `2025-10-15` |
| `EVENT_VENUE` | `MIT Academy of Engineering, Alandi` |
| `ORGANIZER` | `ACES MIT ADT` |

### **Step 2: Deploy**
```bash
cd qr-scan
vercel --prod
```

## 🔧 **What I Fixed**

1. **Removed Vercel Secrets syntax** (`@mongodb-uri`) from `vercel.json`
2. **Updated environment variables** to use standard format
3. **Added function timeout** configuration for better performance
4. **Updated example file** with your actual MongoDB credentials

## 📋 **Environment Variables Explained**

- **MONGODB_URI**: Your MongoDB Atlas connection string
- **ADMIN_SECRET**: Password for accessing admin statistics
- **EVENT_NAME**: Display name for your event
- **EVENT_DATE**: When your event is happening
- **EVENT_VENUE**: Where your event is taking place
- **ORGANIZER**: Your organization name

## 🎯 **Next Steps**

1. Copy the environment variables to Vercel dashboard
2. Redeploy your QR scanner
3. Test the scanner with a sample QR code
4. Verify MongoDB connection is working

The error should be resolved once you add these environment variables to your Vercel project settings!