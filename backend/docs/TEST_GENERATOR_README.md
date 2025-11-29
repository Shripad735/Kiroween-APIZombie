# Test Generator Engine

## Overview

The Test Generator Engine is an AI-powered component that automatically generates comprehensive test suites for API endpoints using Groq's LLM. It creates tests across multiple categories including success cases, error cases, edge cases, and security tests.

## Features

- **AI-Powered Test Generation**: Uses Groq LLM to generate realistic and comprehensive test cases
- **Multiple Test Categories**: Generates tests for success, error, edge, and security scenarios
- **Jest Format Output**: Produces executable Jest test code
- **Database Storage**: Saves generated test suites to MongoDB for reuse
- **Test Execution**: Framework for running generated tests programmatically (in development)

## API Endpoints

### Generate Test Suite
```
POST /api/tests/generate
```

**Request Body:**
```json
{
  "apiSpecId": "string (required)",
  "endpoint": "string (required)",
  "name": "string (optional)",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "testSuite": {
      "id": "string",
      "name": "string",
      "description": "string",
      "endpoint": "string",
      "testCount": number,
      "tests": [
        {
          "name": "string",
          "description": "string",
          "request": { ... },
          "expectedResponse": { ... },
          "category": "success|error|edge|security"
        }
      ],
      "createdAt": "date"
    },
    "testCode": "string (Jest test code)"
  },
  "message": "Test suite successfully generated"
}
```

### Run Test Suite
```
POST /api/tests/run
```

**Request Body:**
```json
{
  "testSuiteId": "string (optional)",
  "testCode": "string (optional)"
}
```

Note: Either `testSuiteId` or `testCode` must be provided.

**Response:**
```json
{
  "success": true,
  "data": {
    "results": {
      "success": true,
      "message": "string",
      "results": {
        "total": number,
        "passed": number,
        "failed": number,
        "duration": number
      }
    },
    "testSuiteId": "string"
  }
}
```

### Get Test Suite
```
GET /api/tests/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "testSuite": { ... },
    "testCode": "string"
  }
}
```

### List Test Suites
```
GET /api/tests?apiSpecId=string&limit=50&skip=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "testSuites": [ ... ],
    "pagination": {
      "total": number,
      "limit": number,
      "skip": number,
      "hasMore": boolean
    }
  }
}
```

### Delete Test Suite
```
DELETE /api/tests/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string"
  },
  "message": "Test suite successfully deleted"
}
```

## Test Categories

The generator creates tests in four categories:

1. **Success Cases**: Valid requests with expected successful responses
2. **Error Cases**: Invalid inputs, missing fields, wrong data types
3. **Edge Cases**: Boundary values, empty/null values, large payloads
4. **Security Tests**: Authentication, authorization, input validation

Each category includes at least 2 tests, for a minimum of 8 tests per endpoint.

## Generated Test Structure

Each test case includes:

- **name**: Descriptive test name
- **description**: What the test validates
- **request**: Complete API request configuration
  - protocol (rest/graphql/grpc)
  - method (for REST)
  - endpoint
  - headers
  - body (if applicable)
  - query/variables (for GraphQL)
- **expectedResponse**: Expected outcome
  - statusCode
  - assertions (array of validation rules)
- **category**: Test category

## Jest Test Code Format

The generated Jest code includes:

- Test suite setup and teardown
- Grouped tests by category
- Axios-based HTTP requests
- Comprehensive assertions
- Proper error handling

Example:
```javascript
describe('User API - /users', () => {
  const baseUrl = 'https://api.example.com';
  
  describe('SUCCESS CASES', () => {
    test('Should successfully retrieve all users', async () => {
      const response = await axios.get(`${baseUrl}/users`);
      
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });
  });
  
  // ... more test categories
});
```

## Usage Example

```javascript
// 1. Generate test suite
const response = await axios.post('http://localhost:5000/api/tests/generate', {
  apiSpecId: '507f1f77bcf86cd799439011',
  endpoint: '/users',
  name: 'User API Tests'
});

const testSuite = response.data.data.testSuite;
const testCode = response.data.data.testCode;

// 2. Save test code to file
fs.writeFileSync('users.test.js', testCode);

// 3. Run tests with Jest
// npm test users.test.js
```

## Implementation Details

### Service Layer
- **testGenerator.service.js**: Core test generation logic
  - `generateTestSuite()`: Generates test cases using Groq LLM
  - `formatTestCode()`: Converts test cases to Jest format
  - `executeTests()`: Runs tests programmatically (in development)

### Controller Layer
- **tests.controller.js**: HTTP request handlers
  - Input validation
  - Error handling
  - Database operations

### Model Layer
- **TestSuite.js**: MongoDB schema for test suites
  - Stores generated tests
  - Tracks execution results
  - Links to API specifications

## Testing

Run the test script to verify functionality:

```bash
cd backend
node test-scripts/test-test-generator-simple.js
```

This will:
1. Create a sample API spec
2. Generate a test suite
3. Retrieve the test suite
4. List all test suites
5. Run the test suite
6. Clean up test data

## Requirements Validated

This implementation satisfies the following requirements:

- **5.1**: Generates tests for success, error, and edge cases
- **5.2**: Includes authentication, authorization, input validation, and response validation tests
- **5.3**: Creates executable test code in Jest format
- **5.4**: Executes tests and displays results (framework in place)
- **5.5**: Provides detailed error messages and suggestions

## Future Enhancements

1. **Full Test Execution**: Complete implementation of Jest programmatic API
2. **Multiple Test Formats**: Support for Postman collections, Mocha, etc.
3. **Test Customization**: Allow users to modify generated tests
4. **Coverage Analysis**: Track which endpoints have test suites
5. **Scheduled Testing**: Automatic test execution on schedule
6. **CI/CD Integration**: Export tests for CI/CD pipelines

## Dependencies

- **groq-sdk**: LLM API for test generation
- **mongoose**: Database operations
- **axios**: HTTP client for test execution
- **jest**: Test framework (for generated tests)

## Error Handling

The service handles various error scenarios:

- Invalid API specification ID
- Missing required fields
- Groq API failures
- Rate limiting
- Database errors
- Invalid test suite IDs

All errors return structured responses with actionable suggestions.
