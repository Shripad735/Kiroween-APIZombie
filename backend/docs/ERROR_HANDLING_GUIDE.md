# Error Handling and Logging Guide

## Overview

APIZombie uses a centralized error handling system with structured logging to provide consistent error responses and comprehensive request/response tracking.

## Error Handling System

### Components

1. **AppError Class**: Custom error class for operational errors
2. **Error Catalog**: Predefined error types with user-friendly messages and suggestions
3. **Error Handler Middleware**: Centralized error processing
4. **Async Handler**: Wrapper for async route handlers
5. **Request Logger**: Logs all incoming requests and outgoing responses

### Using the Error Handling System

#### 1. Import Required Functions

```javascript
import { asyncHandler, createError } from '../middleware/errorHandler.middleware.js';
```

#### 2. Wrap Route Handlers with asyncHandler

The `asyncHandler` automatically catches errors in async functions and passes them to the error handler:

```javascript
export const myController = asyncHandler(async (req, res) => {
  // Your code here
  // Any thrown errors will be automatically caught
});
```

#### 3. Throw Errors Using createError

Use `createError` to throw standardized errors:

```javascript
// Basic usage - uses predefined error from catalog
throw createError('NOT_FOUND');

// With custom message
throw createError('NOT_FOUND', 'User with ID 123 not found');

// With additional details
throw createError('INVALID_INPUT', 'Invalid email format', { email: 'bad-email' });
```

### Available Error Codes

#### Authentication & Authorization
- `AUTH_FAILED` - Authentication failed (401)
- `INVALID_API_KEY` - Invalid or missing API key (401)
- `UNAUTHORIZED` - Unauthorized access (403)

#### Validation Errors
- `INVALID_INPUT` - Invalid input provided (400)
- `INVALID_API_SPEC` - Invalid API specification format (400)
- `MISSING_REQUIRED_FIELD` - Required field is missing (400)

#### Resource Errors
- `NOT_FOUND` - Resource not found (404)
- `ALREADY_EXISTS` - Resource already exists (409)

#### External API Errors
- `EXTERNAL_API_ERROR` - External API request failed (502)
- `API_TIMEOUT` - API request timed out (504)
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded (429)

#### LLM/AI Errors
- `LLM_ERROR` - AI processing failed (500)
- `LLM_TIMEOUT` - AI processing timed out (504)
- `INVALID_LLM_RESPONSE` - AI generated invalid response (500)

#### Database Errors
- `DATABASE_ERROR` - Database operation failed (500)
- `CONNECTION_ERROR` - Database connection failed (503)

#### Workflow Errors
- `WORKFLOW_EXECUTION_FAILED` - Workflow execution failed (500)
- `WORKFLOW_STEP_FAILED` - Workflow step failed (500)

#### Protocol Translation Errors
- `TRANSLATION_NOT_POSSIBLE` - Protocol translation not possible (400)

#### Test Generation Errors
- `TEST_GENERATION_FAILED` - Test generation failed (500)

#### File Upload Errors
- `FILE_TOO_LARGE` - File size exceeds limit (413)
- `INVALID_FILE_TYPE` - Invalid file type (400)

#### Generic Errors
- `INTERNAL_SERVER_ERROR` - Unexpected error (500)
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable (503)

### Example Controller Implementation

```javascript
import { asyncHandler, createError } from '../middleware/errorHandler.middleware.js';
import { successResponse } from '../utils/responseFormatter.js';
import logger from '../utils/logger.js';

export const getUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Validate input
  if (!userId) {
    throw createError('MISSING_REQUIRED_FIELD', 'User ID is required');
  }

  // Find user
  const user = await User.findById(userId);

  if (!user) {
    throw createError('NOT_FOUND', `User with ID ${userId} not found`);
  }

  // Log success
  logger.info('User retrieved successfully', { userId });

  // Return success response
  return res.json(
    successResponse({ user }, 'User retrieved successfully')
  );
});

export const createUser = asyncHandler(async (req, res) => {
  const { email, name } = req.body;

  // Validate input
  if (!email || !name) {
    throw createError('INVALID_INPUT', 'Email and name are required');
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError('ALREADY_EXISTS', 'User with this email already exists');
  }

  // Create user
  const user = await User.create({ email, name });

  logger.info('User created successfully', { userId: user._id, email });

  return res.status(201).json(
    successResponse({ user }, 'User created successfully')
  );
});
```

## Logging System

### Logger Configuration

The logger uses Winston and is configured in `backend/src/utils/logger.js`:

- **Console logging**: Always enabled with colorized output
- **File logging**: Enabled in production
  - `logs/error.log` - Error level logs only
  - `logs/combined.log` - All logs

### Log Levels

- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug messages (set `LOG_LEVEL=debug` in .env)

### Using the Logger

```javascript
import logger from '../utils/logger.js';

// Info level
logger.info('User logged in', { userId: '123', email: 'user@example.com' });

// Warning level
logger.warn('Slow query detected', { query: 'SELECT *', duration: '5000ms' });

// Error level
logger.error('Database connection failed', { error: error.message });

// Debug level (only when LOG_LEVEL=debug)
logger.debug('Processing request', { requestId: '123', data: requestData });
```

### Request Logging

All API requests and responses are automatically logged by the `requestLogger` middleware:

**Incoming Request Log:**
```json
{
  "level": "info",
  "message": "Incoming request",
  "requestId": "uuid-v4",
  "method": "POST",
  "url": "/api/nl/parse",
  "path": "/api/nl/parse",
  "query": {},
  "ip": "127.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "contentType": "application/json"
}
```

**Outgoing Response Log:**
```json
{
  "level": "info",
  "message": "Outgoing response",
  "requestId": "uuid-v4",
  "method": "POST",
  "url": "/api/nl/parse",
  "statusCode": 200,
  "duration": "1234ms",
  "success": true
}
```

### Sensitive Data Protection

The logger automatically redacts sensitive fields:
- `password`
- `token`
- `apiKey`
- `secret`
- `authorization`
- `credentials`
- `accessToken`
- `refreshToken`

### Performance Monitoring

Enable performance monitoring by setting `ENABLE_PERFORMANCE_MONITORING=true` in your `.env` file:

```env
ENABLE_PERFORMANCE_MONITORING=true
```

This will log:
- Request duration
- Memory usage delta
- Warnings for slow requests (>3s)
- Warnings for high memory usage (>50MB)

## Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": null,
    "suggestions": [
      "Verify the resource ID is correct",
      "Check if the resource has been deleted",
      "Ensure you are using the correct endpoint"
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Environment Variables

Add these to your `.env` file:

```env
# Logging
LOG_LEVEL=info                          # Options: error, warn, info, debug
ENABLE_PERFORMANCE_MONITORING=false     # Enable performance tracking

# Node Environment
NODE_ENV=development                    # Options: development, production
```

## Best Practices

1. **Always use asyncHandler**: Wrap all async route handlers with `asyncHandler`
2. **Use predefined error codes**: Use `createError` with catalog error codes
3. **Log important events**: Use logger for significant operations
4. **Don't log sensitive data**: The logger automatically redacts common sensitive fields
5. **Provide context**: Include relevant data in log messages
6. **Use appropriate log levels**: 
   - `error` for errors
   - `warn` for warnings
   - `info` for normal operations
   - `debug` for detailed debugging
7. **Handle specific errors**: Catch and convert specific errors (like LLM errors) to appropriate error codes

## Testing Error Handling

Test your error handling by:

1. **Invalid input**: Send requests with missing or invalid data
2. **Not found**: Request non-existent resources
3. **External API failures**: Test with unreachable APIs
4. **Database errors**: Test with invalid database connections
5. **Rate limiting**: Send rapid requests to trigger rate limits

## Monitoring and Debugging

### View Logs

**Development:**
- Logs appear in console with colors

**Production:**
- Check `logs/error.log` for errors
- Check `logs/combined.log` for all logs

### Request Tracing

Each request gets a unique `requestId` that appears in all related logs. Use this to trace a request through the system:

```bash
# Search logs for a specific request
grep "uuid-v4" logs/combined.log
```

### Common Issues

**Issue: Logs not appearing**
- Check `LOG_LEVEL` environment variable
- Ensure logger is imported correctly

**Issue: Sensitive data in logs**
- Add field names to `sensitiveFields` array in `requestLogger.middleware.js`

**Issue: Error not caught**
- Ensure route handler is wrapped with `asyncHandler`
- Check that error is thrown, not returned

## Migration Guide

To migrate existing controllers to the new error handling system:

1. Import `asyncHandler` and `createError`
2. Wrap route handler with `asyncHandler`
3. Replace try-catch blocks with direct error throwing
4. Replace manual error responses with `createError`
5. Remove manual error logging (handled by middleware)

**Before:**
```javascript
export const myController = async (req, res) => {
  try {
    // code
  } catch (error) {
    logger.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
```

**After:**
```javascript
export const myController = asyncHandler(async (req, res) => {
  // code
  // Errors are automatically caught and handled
});
```
