# Security Implementation Guide

## Overview

APIZombie implements multiple layers of security to protect against common web vulnerabilities and attacks. This document outlines all security measures implemented in the system.

## Security Features

### 1. Input Sanitization

**Location**: `backend/src/middleware/sanitization.middleware.js`

**Purpose**: Prevents injection attacks by sanitizing all user input

**Implementation**:
- Removes dangerous patterns (script tags, JavaScript protocols, event handlers)
- Sanitizes request body, query parameters, and URL parameters
- Validates required fields
- Validates MongoDB ObjectId format

**Usage**:
```javascript
import { sanitizeInput, validateRequiredFields, validateObjectId } from './middleware/sanitization.middleware.js';

// Apply to all routes
app.use(sanitizeInput);

// Validate specific fields
router.post('/endpoint', validateRequiredFields(['field1', 'field2']), handler);

// Validate ObjectId parameters
router.get('/resource/:id', validateObjectId('id'), handler);
```

### 2. Rate Limiting

**Location**: `backend/src/middleware/rateLimiter.middleware.js`

**Purpose**: Prevents brute force attacks and API abuse

**Rate Limiters**:

| Limiter | Window | Max Requests | Applied To |
|---------|--------|--------------|------------|
| General | 15 min | 100 | All API routes |
| AI | 15 min | 20 | NL parsing, translation, test generation |
| Auth | 15 min | 5 | Authentication endpoints |
| Upload | 15 min | 10 | File upload endpoints |

**Usage**:
```javascript
import { generalLimiter, aiLimiter, authLimiter, uploadLimiter } from './middleware/rateLimiter.middleware.js';

// General rate limiting
app.use('/api/', generalLimiter);

// AI-specific rate limiting
router.post('/nl/parse', aiLimiter, handler);

// Upload rate limiting
router.post('/specs/upload', uploadLimiter, handler);
```

### 3. CORS Configuration

**Location**: `backend/src/server.js`

**Purpose**: Controls which origins can access the API

**Configuration**:
- Allowed origins: Frontend URL from environment variable
- Credentials: Enabled for authenticated requests
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization, X-API-Key

**Environment Variables**:
```env
FRONTEND_URL=http://localhost:3000
```

### 4. Request Size Limits

**Location**: `backend/src/server.js`

**Purpose**: Prevents DoS attacks via large payloads

**Limits**:
- JSON body: 10MB
- URL-encoded body: 10MB

**Configuration**:
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### 5. API Key Validation

**Location**: `backend/src/middleware/apiKey.middleware.js`

**Purpose**: Validates API keys for protected endpoints

**Middleware Functions**:

- `validateApiKey`: Requires valid API key (optional - only if API_KEY env var is set)
- `validateGroqApiKey`: Ensures Groq API key is configured
- `optionalApiKey`: Warns about invalid keys but doesn't block

**Usage**:
```javascript
import { validateApiKey, validateGroqApiKey } from './middleware/apiKey.middleware.js';

// Protect endpoint with API key
router.post('/protected', validateApiKey, handler);

// Ensure Groq API key is configured
router.post('/nl/parse', validateGroqApiKey, handler);
```

**Environment Variables**:
```env
API_KEY=your-optional-api-key-here
GROQ_API_KEY=your-groq-api-key-here
```

### 6. Helmet.js Security Headers

**Location**: `backend/src/server.js`

**Purpose**: Sets secure HTTP headers

**Headers Set**:
- `Content-Security-Policy`: Prevents XSS attacks
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-Frame-Options`: Prevents clickjacking
- `X-XSS-Protection`: Enables browser XSS protection
- `Strict-Transport-Security`: Enforces HTTPS

**Configuration**:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 7. Credential Encryption

**Location**: `backend/src/models/AuthConfig.js`

**Purpose**: Encrypts sensitive authentication credentials

**Algorithm**: AES-256-CBC with random IV

**Encrypted Fields**:
- API keys
- Bearer tokens
- Basic auth passwords
- OAuth 2.0 access tokens
- OAuth 2.0 refresh tokens
- OAuth 2.0 client secrets

**Implementation**:
```javascript
// Encryption happens automatically on save
const authConfig = new AuthConfig({
  authType: 'apikey',
  apiKey: {
    key: 'X-API-Key',
    value: 'my-secret-key', // Will be encrypted
  },
});
await authConfig.save();

// Decryption
const decrypted = authConfig.decryptValue(authConfig.apiKey.value);
```

**Environment Variables**:
```env
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

**Important**: The encryption key must be exactly 32 characters. Change it in production!

## Testing Security Features

### Test Credential Encryption

```bash
node backend/test-scripts/test-encryption.js
```

This test verifies:
- API key encryption/decryption
- Bearer token encryption/decryption
- Basic auth password encryption/decryption
- OAuth 2.0 credentials encryption/decryption
- Encryption randomness (different encrypted values for same input)

### Test Security Features

```bash
# Start the backend server first
npm run dev

# In another terminal, run the security tests
node backend/test-scripts/test-security-features.js
```

This test verifies:
- Health check endpoint
- Input sanitization
- Rate limiting
- CORS configuration
- Security headers (Helmet)
- Request size limits
- ObjectId validation

## Security Best Practices

### 1. Environment Variables

**Never commit sensitive data to version control**

Required environment variables:
```env
# Database
MONGODB_URI=your-mongodb-connection-string

# API Keys
GROQ_API_KEY=your-groq-api-key

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret-key
API_KEY=your-optional-api-key

# CORS
FRONTEND_URL=https://your-frontend-domain.com
```

### 2. Production Deployment

Before deploying to production:

1. **Change default secrets**:
   - Generate a strong 32-character encryption key
   - Generate a strong JWT secret
   - Set a strong API key (if using)

2. **Update CORS origins**:
   - Set `FRONTEND_URL` to your production domain
   - Remove development origins

3. **Enable HTTPS**:
   - Use HTTPS in production
   - HSTS headers will enforce HTTPS

4. **Set NODE_ENV**:
   ```env
   NODE_ENV=production
   ```

5. **Monitor rate limits**:
   - Adjust rate limits based on your usage patterns
   - Consider implementing per-user rate limiting

### 3. Database Security

- Use MongoDB Atlas with IP whitelisting
- Enable authentication on MongoDB
- Use strong passwords
- Regularly backup data
- Enable encryption at rest

### 4. API Key Management

- Rotate API keys regularly
- Use different keys for different environments
- Never log API keys
- Store keys in environment variables, not in code

### 5. Error Handling

- Don't expose sensitive information in error messages
- Log errors securely
- Use generic error messages for users
- Include detailed errors only in development mode

## Security Checklist

- [x] Input sanitization middleware
- [x] Rate limiting (general, AI, auth, upload)
- [x] CORS configuration
- [x] Request size limits
- [x] API key validation
- [x] Helmet.js security headers
- [x] Credential encryption (AES-256-CBC)
- [x] Environment variable configuration
- [x] Error handling
- [x] MongoDB connection security
- [x] ObjectId validation
- [x] Test scripts for verification

## Vulnerability Reporting

If you discover a security vulnerability, please email security@apizombie.com (or your designated security contact).

Do not create public GitHub issues for security vulnerabilities.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
