# Database Connection Fix for Vercel Serverless

## Issue
MongoDB connection timing out in Vercel serverless environment with error:
```
Operation `apispecs.find()` buffering timed out after 10000ms
```

## Root Cause
In serverless environments, the database connection wasn't being established before requests were processed. The connection was initiated asynchronously but not awaited, causing requests to fail while waiting for the connection.

## Solution Implemented

### 1. Created DB Connection Middleware
**File:** `backend/src/middleware/dbConnection.middleware.js`

This middleware:
- Checks if MongoDB is connected before processing API requests
- Waits for in-progress connections
- Attempts to connect if not connected
- Returns 503 error if connection fails
- Ensures all API routes have a valid DB connection

### 2. Improved Database Configuration
**File:** `backend/src/config/database.js`

Improvements:
- Better connection state checking
- Prevents multiple simultaneous connection attempts
- Increased timeout for serverless cold starts (10s)
- Better connection pooling settings
- More detailed error logging
- Proper error throwing in serverless environment

### 3. Updated Server Configuration
**File:** `backend/src/server.js`

Changes:
- Added `ensureDBConnection` middleware to all `/api/*` routes
- Improved initial connection handling
- Better error logging

## Configuration Changes

### MongoDB Connection Options
```javascript
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,  // 10s for cold starts
  socketTimeoutMS: 45000,            // 45s for long operations
  maxPoolSize: 10,                   // Limit connections
  minPoolSize: 1,                    // Keep at least 1 connection
  maxIdleTimeMS: 10000,              // Close idle connections
}
```

## Deployment

### Step 1: Verify Environment Variables

Go to Vercel → Your Backend Project → Settings → Environment Variables

Ensure `MONGODB_URI` is set correctly:
```
mongodb+srv://username:password@cluster.mongodb.net/APIZombie?retryWrites=true&w=majority
```

**Common Issues:**
- Missing `MONGODB_URI` variable
- Incorrect username/password
- Special characters in password not URL-encoded
- Wrong database name
- Missing `?retryWrites=true&w=majority` parameters

### Step 2: Verify MongoDB Atlas Configuration

1. **Network Access:**
   - Go to MongoDB Atlas → Network Access
   - Ensure `0.0.0.0/0` is whitelisted (required for Vercel)

2. **Database User:**
   - Go to Database Access
   - Verify user exists with correct password
   - Ensure user has "Read and write to any database" permissions

3. **Cluster Status:**
   - Verify cluster is running (not paused)
   - Check cluster is accessible

### Step 3: Deploy Changes

```bash
git add backend/src/middleware/dbConnection.middleware.js
git add backend/src/config/database.js
git add backend/src/server.js
git commit -m "Fix MongoDB connection in serverless environment"
git push origin main
```

Vercel will automatically redeploy.

## Testing After Deployment

### 1. Check Health Endpoint
```bash
curl https://your-backend-url.vercel.app/health
```

Should show:
```json
{
  "success": true,
  "message": "APIZombie Backend is running! 🧟",
  "mongodb": "connected"
}
```

### 2. Test API Endpoint
```bash
curl https://your-backend-url.vercel.app/api/specs
```

Should return:
- Success: `{"success": true, "data": [...]}`
- Or empty array if no specs: `{"success": true, "data": []}`

### 3. Check Vercel Logs

1. Go to Vercel → Your Backend Project
2. Click on latest deployment
3. Go to "Functions" tab
4. Look for logs showing:
   - `✅ MongoDB Connected: cluster.mongodb.net`
   - `📊 Database: APIZombie`

## Troubleshooting

### Issue: Still Getting Timeout Errors

**Check:**
1. MongoDB Atlas cluster is running
2. Network access includes 0.0.0.0/0
3. Connection string is correct
4. Database user has correct permissions

**Debug:**
```bash
# Check Vercel environment variables
vercel env ls

# View function logs
# Go to Vercel dashboard → Deployment → Functions tab
```

### Issue: "Database Unavailable" Error

This means the middleware is working but can't connect to MongoDB.

**Solutions:**
1. Verify `MONGODB_URI` environment variable in Vercel
2. Test connection string locally:
   ```bash
   cd backend
   node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected!')).catch(err => console.error(err));"
   ```
3. Check MongoDB Atlas status page
4. Verify IP whitelist includes 0.0.0.0/0

### Issue: Slow First Request

**Expected Behavior:**
- First request after cold start may take 5-10 seconds
- Subsequent requests should be fast (<1 second)
- This is normal for serverless + MongoDB

**Optimization:**
- Connection is cached between requests
- Middleware ensures connection before processing
- Consider upgrading MongoDB cluster for better performance

### Issue: Connection String Format

**Correct Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/APIZombie?retryWrites=true&w=majority
```

**URL Encode Special Characters:**
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`

Example:
```
Password: P@ssw0rd#123
Encoded: P%40ssw0rd%23123
```

## Expected Behavior After Fix

1. ✅ First request may take 5-10 seconds (cold start + DB connection)
2. ✅ Subsequent requests fast (<1 second)
3. ✅ Connection cached between requests
4. ✅ Automatic reconnection if connection drops
5. ✅ Clear error messages if DB unavailable
6. ✅ No more timeout errors

## Monitoring

### Check Connection Status

Add this to your health endpoint response (already done):
```json
{
  "mongodb": "connected" | "disconnected"
}
```

### View Logs in Vercel

1. Go to deployment
2. Functions tab
3. Look for:
   - `✅ MongoDB Connected`
   - `♻️ Using existing MongoDB connection`
   - `⏳ MongoDB connection in progress`

### Common Log Messages

**Good:**
- `✅ MongoDB Connected: cluster.mongodb.net`
- `♻️ Using existing MongoDB connection`
- `Initial MongoDB connection established`

**Warnings:**
- `⏳ MongoDB connection in progress, waiting...`
- `Initial MongoDB connection failed, will retry on first request`

**Errors:**
- `❌ MongoDB Connection Error: ...`
- `Database connection middleware error: ...`

## Performance Tips

1. **Keep Connections Warm:**
   - Use Vercel cron jobs to ping health endpoint every 5 minutes
   - Prevents cold starts

2. **Optimize Queries:**
   - Add indexes to frequently queried fields
   - Use projection to limit returned fields
   - Implement pagination

3. **Connection Pooling:**
   - Already configured with `maxPoolSize: 10`
   - Adjust based on usage

4. **Upgrade MongoDB:**
   - Free tier (M0) has limitations
   - Consider M2/M5 for better performance

## Files Modified

- `backend/src/middleware/dbConnection.middleware.js` (NEW)
- `backend/src/config/database.js` (UPDATED)
- `backend/src/server.js` (UPDATED)

## Rollback

If issues persist:

```bash
git revert HEAD
git push origin main
```

Then check MongoDB Atlas configuration and connection string.
