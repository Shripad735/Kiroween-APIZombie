# Groq API Setup Guide

## Current Status
❌ The Groq API key in your `.env` file is **invalid or expired**.

## How to Get a New API Key

1. **Visit Groq Console**
   - Go to: https://console.groq.com/keys
   - Sign in or create a free account

2. **Create a New API Key**
   - Click "Create API Key"
   - Give it a name (e.g., "APIZombie Development")
   - Copy the generated key

3. **Update Your .env File**
   - Open `backend/.env`
   - Replace the current `GROQ_API_KEY` value with your new key:
   ```
   GROQ_API_KEY=gsk_your_new_key_here
   ```

4. **Test the Connection**
   ```bash
   cd backend
   node test-groq-connection.js
   ```

   You should see:
   ```
   ✅ Success! Groq API is working.
   Response: Hello, APIZombie! ...
   ```

5. **Restart the Server**
   ```bash
   npm start
   ```

6. **Test the NL API**
   ```bash
   node test-nl-api.js
   ```

## Troubleshooting

### Error: "Invalid API Key"
- The key is expired or incorrect
- Get a new key from https://console.groq.com/keys
- Make sure there are no extra spaces in the .env file

### Error: "Rate Limit Exceeded"
- You've hit the free tier limit
- Wait a few minutes and try again
- Consider upgrading your Groq account

### Error: "Connection Refused"
- Check your internet connection
- Verify you can access https://api.groq.com

## Free Tier Limits

Groq's free tier includes:
- Multiple models available (Mixtral, Llama 3, etc.)
- Generous rate limits for development
- No credit card required

## Alternative: Use a Different Model

If you want to use a different Groq model, update `backend/src/config/groq.js`:

```javascript
export const GROQ_CONFIG = {
  model: 'llama3-8b-8192', // Faster model
  // or
  model: 'llama3-70b-8192', // More powerful model
  temperature: 0.6,
  max_tokens: 4096,
  top_p: 1,
};
```

## Next Steps

Once you have a valid API key:
1. ✅ Test the connection: `node test-groq-connection.js`
2. ✅ Test the NL API: `node test-nl-api.js`
3. ✅ Start building your API testing workflows!

---

**Need Help?**
- Groq Documentation: https://console.groq.com/docs
- Groq Discord: https://discord.gg/groq
