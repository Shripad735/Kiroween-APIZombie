# APIZombie Deployment Guide

This guide covers deploying APIZombie to production using Vercel for both frontend and backend.

## Prerequisites

Before deploying, ensure you have:

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas Account**: Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
3. **Groq API Key**: Get your API key from [console.groq.com](https://console.groq.com)
4. **GitHub Repository**: Your code should be in a GitHub repository

## Part 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Cluster

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click "Build a Database"
3. Choose the **FREE** tier (M0 Sandbox)
4. Select your preferred cloud provider and region
5. Name your cluster (e.g., "APIZombie-Production")
6. Click "Create Cluster"

### 1.2 Configure Database Access

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and **strong password** (save these securely)
5. Set user privileges to "Read and write to any database"
6. Click "Add User"

### 1.3 Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is required for Vercel serverless functions
4. Click "Confirm"

### 1.4 Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster.mongodb.net/`)
5. Replace `<password>` with your actual password
6. Add the database name: `mongodb+srv://username:password@cluster.mongodb.net/APIZombie?retryWrites=true&w=majority`

## Part 2: Groq API Setup

### 2.1 Get Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create API Key"
5. Name it "APIZombie Production"
6. Copy the API key (starts with `gsk_`)
7. **Save it securely** - you won't be able to see it again

## Part 3: Backend Deployment (Vercel)

### 3.1 Prepare Backend for Deployment

The backend is already configured with `vercel.json`. Ensure all dependencies are listed in `package.json`.

### 3.2 Deploy Backend to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`

### 3.3 Configure Backend Environment Variables

In the Vercel project settings, add these environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/APIZombie?retryWrites=true&w=majority
GROQ_API_KEY=gsk_your_groq_api_key_here
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secure-random-string-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

**Important Notes:**
- Generate a secure `JWT_SECRET` (use a password generator for 32+ characters)
- Generate a secure `ENCRYPTION_KEY` (exactly 32 characters)
- You'll update `FRONTEND_URL` after deploying the frontend

### 3.4 Deploy Backend

1. Click "Deploy"
2. Wait for deployment to complete
3. Copy your backend URL (e.g., `https://api-zombie-backend.vercel.app`)
4. Test the health endpoint: `https://your-backend-url.vercel.app/health`

## Part 4: Frontend Deployment (Vercel)

### 4.1 Update Frontend Environment Variables

1. Edit `frontend/.env.production`
2. Replace the placeholder with your actual backend URL:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   ```
3. Commit and push this change to GitHub

### 4.2 Deploy Frontend to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository (same repo, different project)
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 4.3 Configure Frontend Environment Variables

In the Vercel project settings, add:

```
VITE_API_URL=https://your-backend-url.vercel.app
```

### 4.4 Deploy Frontend

1. Click "Deploy"
2. Wait for deployment to complete
3. Copy your frontend URL (e.g., `https://api-zombie.vercel.app`)

## Part 5: Final Configuration

### 5.1 Update Backend CORS

1. Go to your backend Vercel project
2. Go to Settings → Environment Variables
3. Update `FRONTEND_URL` with your actual frontend URL:
   ```
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```
4. Redeploy the backend (Deployments → click "..." → Redeploy)

### 5.2 Test the Application

1. Visit your frontend URL
2. Try uploading an API specification
3. Test natural language to API conversion
4. Execute a test API request
5. Check that data persists (refresh the page)

## Part 6: Custom Domain (Optional)

### 6.1 Add Custom Domain to Frontend

1. Go to your frontend Vercel project
2. Go to Settings → Domains
3. Add your custom domain (e.g., `apizombie.com`)
4. Follow Vercel's instructions to configure DNS

### 6.2 Add Custom Domain to Backend

1. Go to your backend Vercel project
2. Go to Settings → Domains
3. Add your custom domain (e.g., `api.apizombie.com`)
4. Follow Vercel's instructions to configure DNS

### 6.3 Update Environment Variables

After adding custom domains:

1. Update backend `FRONTEND_URL` to your custom frontend domain
2. Update frontend `VITE_API_URL` to your custom backend domain
3. Redeploy both projects

## Troubleshooting

### Backend Issues

**Problem**: Health check returns 404
- **Solution**: Ensure `vercel.json` is in the backend root directory
- **Solution**: Check that the route in `vercel.json` points to `src/server.js`

**Problem**: MongoDB connection fails
- **Solution**: Verify connection string is correct
- **Solution**: Check that IP whitelist includes 0.0.0.0/0
- **Solution**: Ensure username/password are correct (no special characters that need encoding)

**Problem**: Groq API errors
- **Solution**: Verify API key is correct
- **Solution**: Check Groq API usage limits

### Frontend Issues

**Problem**: API requests fail with CORS errors
- **Solution**: Verify `FRONTEND_URL` in backend matches your frontend domain
- **Solution**: Check that backend is deployed and accessible

**Problem**: Environment variables not working
- **Solution**: Ensure variables start with `VITE_`
- **Solution**: Redeploy after changing environment variables

**Problem**: 404 on page refresh
- **Solution**: Ensure `vercel.json` includes the rewrite rule for SPA routing

### General Issues

**Problem**: Changes not reflecting
- **Solution**: Clear browser cache
- **Solution**: Trigger a new deployment in Vercel
- **Solution**: Check that you pushed changes to GitHub

## Monitoring and Maintenance

### View Logs

1. Go to your Vercel project
2. Click on a deployment
3. View "Functions" tab for serverless function logs
4. View "Build Logs" for deployment issues

### Monitor Performance

1. Vercel provides analytics in the "Analytics" tab
2. Monitor MongoDB usage in Atlas dashboard
3. Monitor Groq API usage in Groq console

### Update Application

1. Push changes to GitHub
2. Vercel automatically deploys from the main branch
3. Test the deployment before merging to main

## Security Checklist

- [ ] MongoDB user has strong password
- [ ] JWT_SECRET is random and secure (32+ characters)
- [ ] ENCRYPTION_KEY is random and secure (exactly 32 characters)
- [ ] Groq API key is kept secret
- [ ] Environment variables are set in Vercel (not in code)
- [ ] CORS is configured with actual frontend URL
- [ ] MongoDB network access is configured
- [ ] All sensitive data is in environment variables

## Cost Considerations

### Free Tier Limits

**Vercel Free Tier:**
- 100 GB bandwidth per month
- Unlimited deployments
- Serverless function execution time limits

**MongoDB Atlas Free Tier (M0):**
- 512 MB storage
- Shared RAM
- No backup/restore

**Groq API:**
- Check current pricing at [groq.com/pricing](https://groq.com/pricing)
- Monitor usage to avoid unexpected costs

### Scaling Considerations

If you exceed free tier limits:
- Upgrade Vercel plan for more bandwidth
- Upgrade MongoDB cluster for more storage/performance
- Monitor Groq API usage and implement caching

## Support

For issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- MongoDB: [mongodb.com/support](https://www.mongodb.com/support)
- Groq: [console.groq.com/support](https://console.groq.com/support)

## Next Steps

After successful deployment:
1. Set up monitoring and alerts
2. Configure custom domains (optional)
3. Set up CI/CD for automated testing
4. Implement backup strategy for MongoDB
5. Set up error tracking (e.g., Sentry)
6. Create user documentation
