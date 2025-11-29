# APIZombie Deployment Quick Start

This is a condensed version of the deployment guide. For detailed instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 1. Prerequisites Setup (15 minutes)

### MongoDB Atlas
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create FREE M0 cluster
3. Create database user with password
4. Whitelist all IPs (0.0.0.0/0)
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/APIZombie?retryWrites=true&w=majority`

### Groq API
1. Sign up at [console.groq.com](https://console.groq.com)
2. Create API key (starts with `gsk_`)
3. Save it securely

### Generate Secrets
```bash
# Generate JWT_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY (exactly 32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 2. Deploy Backend to Vercel (10 minutes)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:
   - Root Directory: `backend`
   - Build Command: `npm run vercel-build`
4. Add environment variables:
   ```
   MONGODB_URI=<your-mongodb-connection-string>
   GROQ_API_KEY=<your-groq-api-key>
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=<generated-jwt-secret>
   ENCRYPTION_KEY=<generated-encryption-key>
   FRONTEND_URL=https://placeholder.vercel.app
   ```
5. Deploy and copy the backend URL

## 3. Deploy Frontend to Vercel (10 minutes)

1. Update `frontend/.env.production`:
   ```
   VITE_API_URL=<your-backend-url>
   ```
2. Commit and push to GitHub
3. Go to [vercel.com/new](https://vercel.com/new)
4. Import same repository (new project)
5. Configure:
   - Root Directory: `frontend`
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add environment variable:
   ```
   VITE_API_URL=<your-backend-url>
   ```
7. Deploy and copy the frontend URL

## 4. Update Backend CORS (5 minutes)

1. Go to backend Vercel project
2. Settings → Environment Variables
3. Update `FRONTEND_URL` with actual frontend URL
4. Deployments → Redeploy

## 5. Test Your Deployment (5 minutes)

Visit your frontend URL and test:
- [ ] Application loads
- [ ] Upload API spec works
- [ ] Natural language parsing works
- [ ] API execution works
- [ ] Data persists after refresh

## Troubleshooting

**CORS errors**: Verify `FRONTEND_URL` in backend matches frontend domain exactly

**MongoDB connection fails**: Check connection string, username, password, and IP whitelist

**API requests fail**: Check backend logs in Vercel deployment

**Environment variables not working**: Redeploy after changing variables

## Total Time: ~45 minutes

For detailed troubleshooting and advanced configuration, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Checklist

Use [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) to ensure all steps are completed.
