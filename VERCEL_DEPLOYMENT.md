# 🚀 Vercel Deployment Guide - Fix "Local Network Access" Issue

## ❌ Problem

When deployed on Vercel, the browser asks for "Local network access" permission because the app is trying to connect to `localhost:5000`.

## ✅ Solution

Use environment variables to point to your production backend URL instead of localhost.

---

## 📋 Step-by-Step Fix

### 1. **Deploy Your Backend First**

Your backend needs to be hosted somewhere accessible (not localhost). Options:

#### Option A: Deploy Backend on Render.com (Recommended - Free)
1. Go to https://render.com
2. Sign up / Login
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `ticket-backend` (or any name)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. Add Environment Variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   EMAIL_HOST=mail.acesmitadt.com
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=your_email
   EMAIL_PASSWORD=your_password
   EMAIL_FROM=noreply@acesmitadt.com
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_admin_password
   ```
7. Click "Create Web Service"
8. Wait for deployment
9. Copy the URL (e.g., `https://ticket-backend.onrender.com`)

#### Option B: Deploy Backend on Railway.app
1. Go to https://railway.app
2. Similar process as Render
3. Get your backend URL

#### Option C: Deploy Backend on Your Own Server
- Use your own VPS/server
- Get the public URL

---

### 2. **Configure Vercel Environment Variable**

1. Go to your Vercel project dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   ```
   Name: VITE_API_URL
   Value: https://your-backend-url.com
   ```
   (Replace with your actual backend URL from Step 1)
5. Select all environments: Production, Preview, Development
6. Click "Save"

---

### 3. **Redeploy Your Frontend**

After adding the environment variable:

**Option A: Automatic (Recommended)**
- Just push to your GitHub repository
- Vercel will auto-deploy with new environment variable

**Option B: Manual**
- Go to Vercel dashboard
- Click "Deployments"
- Click "Redeploy" on latest deployment

---

### 4. **Verify It Works**

1. Open your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Open browser DevTools (F12)
3. Go to Network tab
4. Try to register
5. Check the API calls - they should go to your backend URL, NOT localhost
6. No more "Local network access" permission!

---

## 🔧 Alternative: Use Relative URLs (If Backend on Same Domain)

If you want to host both frontend and backend on the same domain:

### Update `src/config.js`:
```javascript
// API Configuration
export const config = {
  // Use relative URL if backend is on same domain
  API_URL: import.meta.env.VITE_API_URL || '/api',
  API_BASE_URL: import.meta.env.VITE_API_URL || '/api'
}
```

### Update `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-url.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This way, all `/api/*` requests are proxied to your backend.

---

## 📝 Environment Variables Explained

### For Development (Local):
- Uses `http://localhost:5000` (from fallback in config.js)
- No environment variable needed

### For Production (Vercel):
- Uses `VITE_API_URL` environment variable
- Must be set in Vercel dashboard
- Points to your hosted backend

---

## 🎯 Quick Checklist

- [ ] Backend deployed and accessible (not localhost)
- [ ] Backend URL copied (e.g., `https://ticket-backend.onrender.com`)
- [ ] Environment variable `VITE_API_URL` added in Vercel
- [ ] Frontend redeployed on Vercel
- [ ] Tested - no "Local network access" permission
- [ ] API calls go to production backend URL

---

## 🐛 Troubleshooting

### Issue: Still asking for local network permission
**Solution**: 
- Clear browser cache
- Check Vercel environment variable is set correctly
- Redeploy the app
- Check browser DevTools → Network tab to see actual API URL

### Issue: API calls failing
**Solution**:
- Verify backend is running and accessible
- Check backend URL is correct
- Verify CORS is enabled on backend
- Check backend environment variables

### Issue: Environment variable not working
**Solution**:
- Make sure variable name is exactly `VITE_API_URL` (case-sensitive)
- Must start with `VITE_` for Vite to pick it up
- Redeploy after adding variable

---

## 📱 Testing

### Test Locally:
```bash
# Set environment variable
export VITE_API_URL=https://your-backend-url.com

# Run dev server
npm run dev
```

### Test Production:
1. Open Vercel URL
2. Open DevTools → Console
3. Run: `console.log(import.meta.env.VITE_API_URL)`
4. Should show your backend URL, not localhost

---

## 🔐 CORS Configuration

Make sure your backend allows requests from Vercel:

### In `backend/server.js`:
```javascript
import cors from 'cors'

const allowedOrigins = [
  'http://localhost:5173',           // Local development
  'https://your-app.vercel.app',     // Vercel production
  'https://your-custom-domain.com'   // Custom domain (if any)
]

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
```

---

## 🎉 Final Setup

### Your `.env` file (for local development):
```env
# Not needed - uses localhost by default
```

### Vercel Environment Variables:
```
VITE_API_URL=https://your-backend-url.com
```

### Backend Environment Variables (Render/Railway):
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
EMAIL_HOST=mail.acesmitadt.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
NODE_ENV=production
```

---

## 📚 Summary

**The "Local network access" permission appears because:**
- Your app is deployed on Vercel (public internet)
- But trying to connect to `localhost:5000` (local network)
- Browser blocks this for security

**Fix:**
1. ✅ Deploy backend to a public URL
2. ✅ Add `VITE_API_URL` environment variable in Vercel
3. ✅ Redeploy frontend
4. ✅ No more permission popup!

---

## 🚀 Recommended Hosting

| Service | Frontend | Backend | Database |
|---------|----------|---------|----------|
| **Vercel** | ✅ Yes | ❌ No | ❌ No |
| **Render** | ✅ Yes | ✅ Yes | ❌ No |
| **Railway** | ✅ Yes | ✅ Yes | ❌ No |
| **MongoDB Atlas** | ❌ No | ❌ No | ✅ Yes |

**Recommended Setup:**
- Frontend: Vercel (free, fast)
- Backend: Render (free tier available)
- Database: MongoDB Atlas (free tier available)

---

**After following these steps, your app will work perfectly on Vercel without any permission popups!** 🎉
