# Vercel Deployment Fix Guide

## Issues Fixed

The serverless function was crashing due to several issues:

1. **Server listening in serverless environment** - `app.listen()` doesn't work in Vercel
2. **File system writes** - Logger trying to write to read-only file system
3. **Database connection handling** - `process.exit()` crashes serverless functions
4. **Missing serverless entry point** - Vercel needs a specific entry point

## Changes Made

### 1. Server Configuration (`backend/src/server.js`)
- Wrapped `app.listen()` to only run in non-serverless environments
- Made database connection non-blocking
- Conditional process event handlers

### 2. Database Connection (`backend/src/config/database.js`)
- Added connection caching for serverless
- Removed `process.exit()` in Vercel environment
- Added shorter timeout for faster failures
- Graceful error handling

### 3. Logger Configuration (`backend/src/utils/logger.js`)
- Disabled file logging in Vercel (read-only file system)
- Console-only logging in serverless
- Prevents file system errors

### 4. Vercel Entry Point (`backend/api/index.js`)
- Created proper serverless entry point
- Updated `vercel.json` to use new entry point

## How to Deploy the Fix

### Option 1: Push to Git (Recommended)

If your Vercel project is connected to GitHub:

```bash
# Commit the changes
git add .
git commit -m "Fix serverless deployment issues"
git push origin main
```

Vercel will automatically redeploy.

### Option 2: Manual Deployment

If not using Git integration:

```bash
cd backend
vercel --prod
```

## Verify Environment Variables

Make sure these are set in your Vercel project:

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Verify these are set:
   - `MONGODB_URI` - Your MongoDB connection string
   - `GROQ_API_KEY` - Your Groq API key
   - `JWT_SECRET` - Your JWT secret
   - `ENCRYPTION_KEY` - Your encryption key (32 chars)
   - `FRONTEND_URL` - Your frontend URL (or placeholder for now)
   - `NODE_ENV` - Should be `production`

## Test After Deployment

Once redeployed, test these endpoints:

### 1. Health Check
```bash
curl https://your-backend-url.vercel.app/health
```

Expected response:
```json
{
  "success": true,
  "message": "APIZombie Backend is running! 🧟",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 2. Check Logs

In Vercel dashboard:
1. Go to your deployment
2. Click "Functions" tab
3. Look for logs showing:
   - ✅ MongoDB Connected
   - ♻️ Using cached MongoDB connection (on subsequent requests)

## Common Issues After Fix

### Issue: Still getting 500 error

**Check:**
1. Environment variables are set correctly
2. MongoDB connection string is valid
3. MongoDB Atlas IP whitelist includes 0.0.0.0/0

**Debug:**
```bash
# View function logs in Vercel dashboard
# Look for specific error messages
```

### Issue: MongoDB connection timeout

**Solution:**
1. Verify MongoDB Atlas cluster is running
2. Check network access settings (0.0.0.0/0)
3. Verify connection string format

### Issue: CORS errors (after backend works)

**Solution:**
1. Update `FRONTEND_URL` environment variable
2. Redeploy backend
3. Ensure no trailing slash in URL

## Expected Behavior

After the fix:

1. ✅ Health endpoint returns 200 OK
2. ✅ MongoDB connects successfully
3. ✅ Logs appear in Vercel dashboard
4. ✅ No file system errors
5. ✅ Function doesn't crash on startup

## Next Steps

Once backend is working:

1. Deploy frontend to Vercel
2. Update backend `FRONTEND_URL` with actual frontend URL
3. Update frontend `VITE_API_URL` with backend URL
4. Test full application

## Rollback (If Needed)

If something goes wrong:

1. Go to Vercel dashboard
2. Deployments tab
3. Find previous working deployment
4. Click "..." → "Promote to Production"

## Support

If issues persist:

1. Check Vercel function logs for specific errors
2. Verify all environment variables
3. Test MongoDB connection separately
4. Check Vercel status page

## Files Modified

- `backend/src/server.js` - Serverless compatibility
- `backend/src/config/database.js` - Connection caching
- `backend/src/utils/logger.js` - Disable file logging
- `backend/api/index.js` - New entry point (created)
- `backend/vercel.json` - Updated configuration

## Testing Locally

To test the changes locally:

```bash
cd backend
npm install
npm start
```

Should work exactly as before in local development.
