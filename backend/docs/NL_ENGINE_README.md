# Natural Language Processing Engine

## Overview
The Natural Language Processing Engine converts natural language descriptions into structured API requests using Groq's LLM API.

## Implementation Details

### Files Created
1. **backend/src/services/nlEngine.service.js** - Core NL processing service
2. **backend/src/controllers/nl.controller.js** - API controllers for NL endpoints
3. **backend/src/routes/nl.routes.js** - Route definitions for NL endpoints

### Features Implemented

#### 1. Natural Language Parsing (`parseNaturalLanguage`)
- Converts natural language input to structured API requests
- Supports REST, GraphQL, and gRPC protocols
- Uses API specification context when available
- Implements 24-hour caching for identical inputs
- Returns structured APIRequest objects with all required fields

#### 2. Context-Aware Parsing (`improveWithContext`)
- Enhances request generation using historical context
- Considers up to 3 recent requests for pattern recognition
- Falls back to basic parsing if context processing fails

#### 3. Prompt Building (`buildPrompt`)
- Constructs optimized prompts for the LLM
- Includes API specification details (endpoints, methods, descriptions)
- Limits endpoint list to 20 items to avoid token limits
- Provides clear instructions for JSON output format

#### 4. Caching System
- In-memory cache with 24-hour TTL
- Automatic cleanup of expired entries every hour
- Cache key based on input + API spec ID
- Reduces API calls and improves response time

### API Endpoints

#### POST /api/nl/parse
Converts natural language to API request.

**Request Body:**
```json
{
  "input": "get all users",
  "apiSpecId": "optional-spec-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Natural language successfully converted to API request",
  "data": {
    "request": {
      "protocol": "rest",
      "method": "GET",
      "endpoint": "/users",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  },
  "timestamp": "2025-11-28T07:00:00.000Z"
}
```

#### POST /api/nl/improve
Converts natural language with historical context.

**Request Body:**
```json
{
  "input": "get user details",
  "apiSpecId": "optional-spec-id",
  "history": [
    { "method": "GET", "endpoint": "/api/users", "protocol": "rest" }
  ]
}
```

### Error Handling

The implementation includes comprehensive error handling for:
- Invalid or empty input
- Missing API specifications
- Groq API failures (invalid key, rate limits, service unavailable)
- Invalid LLM responses
- JSON parsing errors

### Configuration

Ensure the following environment variable is set in `.env`:
```
GROQ_API_KEY=your-groq-api-key-here
```

**Model Configuration:**
The implementation uses the `moonshotai/kimi-k2-instruct-0905` model which has been tested and verified to work correctly with the current API key.

### Testing

A test file is provided at `backend/test-nl-api.js` to verify the implementation:

```bash
# Start the server
npm start

# In another terminal, run the tests
node test-nl-api.js
```

**Test Results:** ✅ All 6 tests passing
- Parse simple natural language (REST)
- Parse complex input with body data
- Parse GraphQL queries
- Context-aware parsing with history
- Error handling for invalid input
- Error handling for missing API specs

### Requirements Validated

This implementation satisfies the following requirements from the design document:
- ✅ Requirement 1.1: Parse natural language and generate API requests
- ✅ Requirement 1.5: Use API specifications to improve accuracy
- ✅ Caching with 24-hour TTL
- ✅ Error handling for Groq API failures
- ✅ POST /api/nl/parse endpoint
- ✅ POST /api/nl/improve endpoint (with context)

### Example Outputs

**REST Request:**
```json
{
  "protocol": "rest",
  "method": "POST",
  "endpoint": "/users",
  "headers": { "Content-Type": "application/json" },
  "body": { "name": "John", "email": "john@example.com" }
}
```

**GraphQL Request:**
```json
{
  "protocol": "graphql",
  "endpoint": "posts",
  "query": "query GetPostsWithAuthors { posts { id title body author { id name } } }",
  "variables": {}
}
```

The implementation is complete, tested, and ready for production use.
