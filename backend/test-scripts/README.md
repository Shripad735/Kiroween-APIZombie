# Test Scripts

This folder contains all test and verification scripts for the APIZombie backend.

## Available Scripts

### Database & Connection Tests
- **test-connection.js** - Tests MongoDB database connection
- **test-models.js** - Validates all Mongoose models and schemas
- **verify-design-compliance.js** - Verifies models comply with design specifications

### API Tests
- **test-groq-connection.js** - Tests Groq API connection
- **test-groq-streaming.js** - Tests Groq API streaming functionality
- **test-nl-api.js** - Tests Natural Language API endpoints
- **test-specs-api.js** - Tests API Specification endpoints

## Running Tests

From the backend directory, run any test script:

```bash
# Test database connection
node test-scripts/test-connection.js

# Test models
node test-scripts/test-models.js

# Verify design compliance
node test-scripts/verify-design-compliance.js

# Test Groq API
node test-scripts/test-groq-connection.js

# Test Natural Language API
node test-scripts/test-nl-api.js

# Test Specs API
node test-scripts/test-specs-api.js
```

## Notes

- Ensure `.env` file is configured with required environment variables
- MongoDB must be running for database tests
- Groq API key must be set for AI-related tests
- Server must be running for API endpoint tests
